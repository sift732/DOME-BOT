const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bot_report')
        .setDescription('指定された内容を報告します')
        .addStringOption(option =>
            option.setName('内容')
                .setDescription('報告内容を入力してください')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('画像')
                .setDescription('画像を送付（URLのみ）')),

    async execute(interaction) {
        const content = interaction.options.getString('内容');
        const imageAttachment = interaction.options.getString('画像');
        
        const embedReport = new MessageEmbed()
            .setColor('#ff0000')
            .setTitle('レポート')
            .setDescription(`内容: ${content}`)
            .addField('\u200b', '\u200b')
            .addField('実行者', interaction.user.tag, true)
            .addField('実行者ID', interaction.user.id, true)
            .addField('\u200b', '\u200b')
            .addField('実行サーバー', interaction.guild.name, true)
            .addField('実行サーバーID', interaction.guild.id, true)
            .addField('\u200b', '\u200b')
            .addField('実行チャンネルID', interaction.channel.id, true)
            .setTimestamp();

        if (imageAttachment) {
            embedReport.setImage(imageAttachment);
        }

        const channelId = process.env.CHANNEL_ID;
        const channel = interaction.client.channels.cache.get(channelId);

        if (channel && channel.isText()) {
            try {
                const row = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId('reply')
                            .setLabel('返信')
                            .setStyle('PRIMARY'),
                        new MessageButton()
                            .setCustomId('discard')
                            .setLabel('破棄')
                            .setStyle('DANGER'),
                        new MessageButton()
                            .setCustomId('warn')
                            .setLabel('警告')
                            .setStyle('SECONDARY')
                    );

                const sentMessage = await channel.send({ embeds: [embedReport], components: [row] });

                const invite = await interaction.guild.channels.cache
                    .filter(c => c.type === 'GUILD_TEXT')
                    .first()
                    .createInvite({
                        maxUses: 3,
                        unique: true,
                        temporary: false,
                        reason: 'Generated invite link for report message'
                    });

                const owner = await interaction.client.users.fetch(process.env.ADMIN);
                if (owner) {
                    await owner.send(`サーバーへの招待リンク: ${invite.url}`);
                }

                const embedSuccess = new MessageEmbed()
                    .setColor('#00ff00')
                    .setTitle('成功')
                    .setDescription('報告が正常に送信されました。\nサポートのため招待リンクを作成しました。\n対応をお待ちください');

                await interaction.reply({ embeds: [embedSuccess] });

                const filter = i => i.customId === 'reply' || i.customId === 'discard' || i.customId === 'warn';
                const collector = channel.createMessageComponentCollector({ filter, time: 60000 });

                collector.on('collect', async i => {
                    if (i.user.id !== process.env.ADMIN) {
                        const embedWarning = new MessageEmbed()
                            .setColor('#ff0000')
                            .setTitle('警告')
                            .setDescription('この操作はできません。');
                        await i.reply({ embeds: [embedWarning], ephemeral: true });
                        return;
                    }

                    await i.deferUpdate();
                    let promptMessage;
                    if (i.customId === 'reply') {
                        promptMessage = '返信メッセージを入力してください。';
                    } else if (i.customId === 'discard') {
                        promptMessage = '破棄メッセージを入力してください。';
                    } else if (i.customId === 'warn') {
                        promptMessage = '警告メッセージを入力してください。';
                    }

                    const promptEmbed = new MessageEmbed()
                        .setColor('#00ff00')
                        .setTitle('入力待機中')
                        .setDescription(promptMessage);

                    await i.followUp({ embeds: [promptEmbed], ephemeral: true });

                    const filterMessage = m => m.author.id === process.env.ADMIN;
                    const messageCollector = channel.createMessageCollector({ filter: filterMessage, max: 1, time: 60000 });

                    messageCollector.on('collect', async message => {
                        let responseEmbed;
                        if (i.customId === 'reply') {
                            responseEmbed = new MessageEmbed()
                                .setColor('#00ff00')
                                .setTitle('サポートからの返信')
                                .setDescription(`返信内容: ${message.content}`);
                        } else if (i.customId === 'discard') {
                            responseEmbed = new MessageEmbed()
                                .setColor('#ff0000')
                                .setTitle('レポートが破棄されました')
                                .setDescription(`破棄理由: ${message.content}`);
                        } else if (i.customId === 'warn') {
                            responseEmbed = new MessageEmbed()
                                .setColor('#ff0000')
                                .setTitle('サポートから警告が届きました')
                                .setDescription(`警告内容: ${message.content}`);
                        }

                        const originChannel = interaction.client.channels.cache.get(interaction.channel.id);
                        if (originChannel && originChannel.isText()) {
                            await originChannel.send({ embeds: [responseEmbed] });
                        }

                        await message.reply({ embeds: [responseEmbed], ephemeral: true });
                    });

                    messageCollector.on('end', collected => {
                        if (collected.size === 0) {
                            const timeoutEmbed = new MessageEmbed()
                                .setColor('#ff0000')
                                .setTitle('タイムアウト')
                                .setDescription('入力が時間切れになりました。');
                            i.followUp({ embeds: [timeoutEmbed], ephemeral: true });
                        }
                    });
                });

            } catch (error) {
                console.error('報告中にエラーが発生しました:', error);

                const embedError = new MessageEmbed()
                    .setColor('#ff0000')
                    .setTitle('エラーが発生しました')
                    .setDescription('報告を送信できませんでした。エラーが発生しました。');

                await interaction.reply({ embeds: [embedError] });
            }
        } else {
            console.error('指定されたチャンネルが見つからないか、テキストチャンネルではありません。');

            const embedError = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle('エラーが発生しました')
                .setDescription('報告を送信できませんでした。指定されたチャンネルが見つからないか、テキストチャンネルではありません。')
                .setFooter('もしくは送信に時間がかかっている可能性があります 数分後に再度実行してください');

            await interaction.reply({ embeds: [embedError] });
        }
    },
};

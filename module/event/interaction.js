const path = require('path');
const fs = require('fs');
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Colors } = require('discord.js');
const { isUserBlacklisted, isServerBlacklisted } = require(path.resolve(__dirname, '../../db/managedb'));
const { WebhookClient } = require('discord.js');
require('dotenv').config();

const webhookClient = new WebhookClient({
    url: process.env.LOG
});

const handleInteraction = async (interaction) => {
    if (!interaction || !interaction.isCommand() && !interaction.isButton()) {
        console.error('Interaction is null or invalid.');
        return;
    }

    if (!interaction.channel || interaction.channel.type === 'DM') {
        const embed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=44&quality=lossless' })
            .setDescription('DMではコマンドを実行することができません。サーバー内でコマンドを実行してください。');

        await interaction.reply({ embeds: [embed] });
        return;
    }

    const { commandName, user, guild } = interaction;

    const guildId = guild?.id || interaction.commandGuildId;

    if (!interaction.client.commands.has(commandName)) return;

    try {
        const userBlacklisted = await isUserBlacklisted(user.id, guildId);
        const serverBlacklisted = await isServerBlacklisted(guildId);

        if (userBlacklisted || serverBlacklisted) {
            const embed = new EmbedBuilder()
                .setColor(Colors.Red)
                .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=44&quality=lossless' })
                .setDescription('あなたまたはこのサーバーはブラックリストに登録されているため、コマンドを実行できません。');
            
            await interaction.reply({ embeds: [embed] });
            return;
        }

        if (interaction.isCommand()) {
            if (commandName.startsWith('admin')) {
                const adminLogEmbed = new EmbedBuilder()
                    .setColor(Colors.Red)
                    .setAuthor({ name: '管理コマンド実行' })
                    .addFields(
                        { name: '実行者', value: user.tag, inline: true },
                        { name: '実行者ID', value: user.id, inline: true },
                        { name: 'サーバー名', value: guild?.name || 'DM', inline: true },
                        { name: 'サーバーID', value: guildId || 'DM', inline: true },
                        { name: 'コマンド名', value: commandName, inline: true }
                    )
                    .setTimestamp();

                await interaction.client.commands.get(commandName).execute(interaction);

                await webhookClient.send({
                    embeds: [adminLogEmbed]
                });

            } else {
                await interaction.client.commands.get(commandName).execute(interaction);

                const guildOwner = guild ? await guild.fetchOwner() : { user: { tag: '不明' } };

                const logEmbed = new EmbedBuilder()
                    .setColor(Colors.Green)
                    .setAuthor({ name: 'コマンド実行ログ', iconURL: 'https://cdn.discordapp.com/emojis/1267809273707233362.webp?size=96&quality=lossless' })
                    .addFields(
                        { name: 'ユーザー名', value: user.tag, inline: true },
                        { name: 'ユーザーID', value: user.id, inline: true },
                        { name: 'サーバー名', value: guild?.name || 'DM', inline: false },
                        { name: 'サーバーID', value: guildId || 'DM', inline: true },
                        { name: 'サーバーメンバー数', value: guild ? guild.memberCount.toString() : '不明', inline: true },
                        { name: 'サーバーオーナー', value: guildOwner.user.tag, inline: true },
                        { name: 'コマンド名', value: commandName, inline: false }
                    )
                    .setTimestamp();

                interaction.options.data.forEach(option => {
                    logEmbed.addFields({ name: `オプション：${option.name}`, value: `内容：${option.value}`, inline: true });
                });

                await webhookClient.send({
                    embeds: [logEmbed]
                });
            }
        } else if (interaction.isButton()) {
            if (interaction.customId === 'support_button') {
                await interaction.reply({ content: 'サポートサーバーのリンクはこちらです。', ephemeral: true });
            }
        }
    } catch (error) {
        const errorEmbed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setAuthor({ name: 'エラーが発生しました', iconURL: 'https://cdn.discordapp.com/emojis/1267808278021406761.webp?size=96&quality=lossless' })
            .setDescription(`エラー内容: ${error.message}\nエラー位置: ${error.stack.split('\n')[1]}`)
            .setTimestamp();

        const supportButton = new ButtonBuilder()
            .setLabel('サポートサーバーに参加する')
            .setStyle(ButtonStyle.Link)
            .setURL(process.env.SUPPORT);

        const row = new ActionRowBuilder().addComponents(supportButton);

        const errorMessageSent = await interaction.reply({ embeds: [errorEmbed], components: [row], fetchReply: true });
        const errorId = errorMessageSent.id;

        const errorMessage = `${error.message}\n${path.basename(__filename)}\n${error.stack.split('\n')[1]}\n${errorId}`;
        const errorFilePath = path.join(__dirname, '../../log', `${errorId}.txt`);
        fs.writeFileSync(errorFilePath, errorMessage);

        const errorLogEmbed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setAuthor({ name: 'エラーが発生しました', iconURL: 'https://cdn.discordapp.com/emojis/1267808282253332481.webp?size=96&quality=lossless' })
            .setDescription(`エラー内容: ${error.message}\nエラーファイル: ${path.basename(__filename)}\nエラー位置: ${error.stack.split('\n')[1]}\nエラーID: ${errorId}`)
            .addFields(
                { name: 'ユーザー名', value: user.tag, inline: true },
                { name: 'ユーザーID', value: user.id, inline: true },
                { name: 'サーバー名', value: guild?.name || '不明', inline: true },
                { name: 'サーバーID', value: guildId || '不明', inline: true },
                { name: 'サーバーメンバー数', value: guild ? guild.memberCount.toString() : '不明', inline: true },
                { name: 'サーバーオーナー', value: (guild ? await guild.fetchOwner() : { user: { tag: '不明' } }).user.tag, inline: true },
                { name: 'コマンド名', value: commandName, inline: true }
            )
            .setTimestamp();

        interaction.options.data.forEach(option => {
            errorLogEmbed.addFields({ name: `オプション：${option.name}`, value: `内容：${option.value}`, inline: true });
        });

        await webhookClient.send({
            embeds: [errorLogEmbed]
        });
    }
};

module.exports = { handleInteraction };
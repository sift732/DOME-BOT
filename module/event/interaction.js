const path = require('path');
const fs = require('fs');
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { isUserBlacklisted, isServerBlacklisted } = require(path.resolve(__dirname, '../../db/managedb'));
const { WebhookClient } = require('discord.js');
require('dotenv').config();

const webhookClient = new WebhookClient({
    url: process.env.LOG
});

const handleInteraction = async (interaction) => {
    if (!interaction.isCommand() && !interaction.isButton()) return;

    const { commandName, user, guild } = interaction;
    const guildId = guild.id;

    if (!interaction.client.commands.has(commandName)) return;

    try {
        const userBlacklisted = await isUserBlacklisted(user.id, guildId);
        const serverBlacklisted = await isServerBlacklisted(guildId);

        if (userBlacklisted || serverBlacklisted) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: 'エラー' })
                .setDescription('あなたまたはこのサーバーはブラックリストに登録されているため、コマンドを実行できません。');
            
            await interaction.reply({ embeds: [embed] });
            return;
        }

        if (interaction.isCommand()) {
            if (commandName.startsWith('admin')) {
                const adminLogEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setAuthor({ name: '管理コマンド実行' })
                    .addFields(
                        { name: '実行者', value: user.tag, inline: true },
                        { name: '実行者ID', value: user.id, inline: true },
                        { name: 'サーバー名', value: guild.name, inline: true },
                        { name: 'サーバーID', value: guildId, inline: true },
                        { name: 'コマンド名', value: commandName, inline: true }
                    )
                    .setTimestamp();

                await interaction.client.commands.get(commandName).execute(interaction);

                await webhookClient.send({
                    embeds: [adminLogEmbed]
                });

            } else {
                await interaction.client.commands.get(commandName).execute(interaction);

                const guildOwner = await guild.fetchOwner();

                const logEmbed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setAuthor({ name: 'コマンド実行ログ', iconURL: 'https://cdn.discordapp.com/emojis/1267809273707233362.webp?size=96&quality=lossless' })
                    .addFields(
                        { name: 'ユーザー名', value: user.tag, inline: true },
                        { name: 'ユーザーID', value: user.id, inline: true },
                        { name: 'サーバー名', value: guild.name, inline: false },
                        { name: 'サーバーID', value: guildId, inline: true },
                        { name: 'サーバーメンバー数', value: guild.memberCount.toString(), inline: true },
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
            .setColor('#ff0000')
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

        const errorMessage = `エラー内容: ${error.message}\nエラーファイル: ${path.basename(__filename)}\nエラー位置: ${error.stack.split('\n')[1]}\nエラーID: ${errorId}`;
        const errorFilePath = path.join(__dirname, '../../log', `${errorId}.txt`);
        fs.writeFileSync(errorFilePath, errorMessage);

        const errorLogEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setAuthor({ name: 'エラーが発生しました', iconURL: 'https://cdn.discordapp.com/emojis/1267808282253332481.webp?size=96&quality=lossless' })
            .setDescription(`エラー内容: ${error.message}\nエラーファイル: ${path.basename(__filename)}\nエラー位置: ${error.stack.split('\n')[1]}\nエラーID: ${errorId}`)
            .addFields(
                { name: 'ユーザー名', value: user.tag, inline: true },
                { name: 'ユーザーID', value: user.id, inline: true },
                { name: 'サーバー名', value: guild.name, inline: true },
                { name: 'サーバーID', value: guildId, inline: true },
                { name: 'サーバーメンバー数', value: guild.memberCount.toString(), inline: true },
                { name: 'サーバーオーナー', value: (await guild.fetchOwner()).user.tag, inline: true },
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

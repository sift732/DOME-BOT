const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const db = require('/home/darkguide/dome-bot/db/managedb.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('global_join')
        .setDescription('グローバルチャットに参加します'),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            const embed = new EmbedBuilder()
                .setAuthor({
                    name: 'エラー',
                    iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless'
                })
                .setDescription('このコマンドを実行する権限がありません。')
                .setColor('#FF0000');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const serverId = interaction.guild.id;
        const channelId = interaction.channel.id;

        try {
            const globalChatServers = await db.getGlobalChatServers();
            if (globalChatServers.some(server => server.server_id === serverId)) {
                const embed = new EmbedBuilder()
                    .setAuthor({
                        name: 'エラー',
                        iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless'
                    })
                    .setDescription('このサーバーはすでにグローバルチャットに参加しています。')
                    .setColor('#FF0000');
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
            const webhook = await interaction.channel.createWebhook({
                name: 'DOME-GLOBALCHAT',
                reason: 'グローバルチャット参加のためにWebhookを作成しました'
            });

            const webhookUrl = webhook.url;

            await db.addGlobalChatServer(serverId, channelId, webhookUrl);

            const embed = new EmbedBuilder()
                .setAuthor({
                    name: '成功',
                    iconURL: 'https://cdn.discordapp.com/emojis/1269391024472592424.webp?size=96&quality=lossless'
                })
                .setDescription(`グローバルチャットに参加しました: ${interaction.channel.name}`)
                .setColor('#00FF00');
            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('エラーが発生しました:', error);

            const embed = new EmbedBuilder()
                .setAuthor({
                    name: 'エラー',
                    iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless'
                })
                .setDescription('グローバルチャットへの参加中にエラーが発生しました。')
                .setColor('#FF0000');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};

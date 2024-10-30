const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, EmbedBuilder, WebhookClient } = require('discord.js');
const db = require('/home/darkguide/dome-bot/db/managedb.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('global_leave')
        .setDescription('グローバルチャットから退会します'),
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
            const server = globalChatServers.find(s => s.server_id === serverId && s.channel_id === channelId);
            if (!server) {
                const embed = new EmbedBuilder()
                    .setAuthor({
                        name: 'エラー',
                        iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless'
                    })
                    .setDescription('このチャンネルはグローバルチャットに登録されていません。')
                    .setColor('#FF0000');
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const { webhook_url } = server;
            const [webhookId, webhookToken] = webhook_url.split('/').slice(-2);

            const webhookClient = new WebhookClient({ id: webhookId, token: webhookToken });

            try {
                await webhookClient.delete();
                console.log(`Webhookが削除されました (${serverId})`);
            } catch (error) {
                console.error(`Webhook削除エラー (${serverId}):`, error);
            }

            await db.removeGlobalChatServer(serverId, channelId);

            const embed = new EmbedBuilder()
                .setAuthor({
                    name: '成功',
                    iconURL: 'https://cdn.discordapp.com/emojis/1269391024472592424.webp?size=96&quality=lossless'
                })
                .setDescription(`グローバルチャットから退会しました`)
                .setColor('#00FF00');
            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('エラーが発生しました:', error);

            const embed = new EmbedBuilder()
                .setAuthor({
                    name: 'エラー',
                    iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless'
                })
                .setDescription('グローバルチャットからの退会中にエラーが発生しました。')
                .setColor('#FF0000');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};
const { WebhookClient, EmbedBuilder } = require('discord.js');
const db = require('/home/darkguide/dome-bot/db/managedb.js');

module.exports = {
    async processMessage(message) {
        try {
            const globalChatServers = await db.getGlobalChatServers();
            const currentChannelId = message.channel.id;

            const isGlobalChatChannel = globalChatServers.some(server => server.channel_id === currentChannelId);

            if (!isGlobalChatChannel) {
                console.log(`メッセージ送信先チャンネル (${currentChannelId}) はグローバルチャットサーバーリストに存在しません。`);
                return;
            }
            const globalBans = await db.getGlobalBans();
            const isGlobalBanned = globalBans.some(ban => ban.user_id === message.author.id);

            if (isGlobalBanned) {
                const ban = globalBans.find(ban => ban.user_id === message.author.id);
                const { reason } = ban;
                const embed = new EmbedBuilder()
                    .setAuthor({
                        name: 'グローバルBAN通知',
                        iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless'
                    })
                    .setColor('#ff0000')
                    .setDescription(`あなたはGBANされています\n理由：${reason}`)
                    .setTimestamp();

                await message.reply({ embeds: [embed] });
                await message.react('❗');
                return;
            }

            for (const server of globalChatServers) {
                const { server_id, channel_id, webhook_url } = server;

                if (currentChannelId === channel_id) {
                    continue;
                }

                const webhookClient = new WebhookClient({ url: webhook_url });

                const embed = new EmbedBuilder()
                    .setAuthor({
                        name: message.author.username,
                        iconURL: message.author.displayAvatarURL()
                    })
                    .setColor('#00ff00')
                    .setTimestamp(message.createdAt)
                    .setFooter({
                        text: `SID: ${server_id} | MID: ${message.id} | UID: ${message.author.id}`,
                        iconURL: message.guild.iconURL()
                    });

                if (message.content) {
                    embed.setDescription(message.content);
                }

                if (message.attachments.size > 0) {
                    const fileNames = message.attachments.map(att => att.name || 'ファイル名がありません').join(', ');
                    embed.setDescription(`${embed.data.description ? embed.data.description + '\n\n' : ''}添付ファイル: ${fileNames}`);
                }

                const files = message.attachments.map(att => att.url);

                try {
                    await webhookClient.send({
                        username: 'DOME-GLOBALCHAT',
                        avatarURL: 'https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/bot.png',
                        embeds: [embed],
                        files: files
                    });

                    await message.react('🌎');
                } catch (error) {
                    console.error(`メッセージ転送エラー (${server_id}):`, error);
                }
            }
        } catch (error) {
            console.error('メッセージ処理中にエラーが発生しました:', error);
        }
    }
};

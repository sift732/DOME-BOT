const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin_db_show')
        .setDescription('ブラックリストのデータベース内容を表示します'),

    async execute(interaction) {
        try {
            const creatorUserId = process.env.ADMIN;

            if (interaction.user.id !== creatorUserId) {
                const embed = new MessageEmbed()
                    .setColor('#ff0000')
                    .setTitle('アクセスエラー')
                    .setDescription('このコマンドは製作者のみ実行できます。');
                return await interaction.reply({ embeds: [embed] });
            }

            const db1 = await open({
                filename: './blackserver.db',
                driver: sqlite3.Database
            });

            const db2 = await open({
                filename: './blackuser.db',
                driver: sqlite3.Database
            });

            const [servers, users] = await Promise.all([
                db1.all('SELECT * FROM blacklisted_servers'),
                db2.all('SELECT * FROM blacklisted_users')
            ]);

            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('ブラックリストのデータベース内容');

            if (servers.length > 0) {
                const serverList = servers.map(server => `サーバーID：${server.server_id}`).join('\n');
                embed.addField('ブラックリストに登録中のサーバー', serverList);
            } else {
                embed.addField('ブラックリストに登録中のサーバー', '404 Not Found');
            }

            if (users.length > 0) {
                const userList = users.map(user => `ID: ${user.user_id}, サーバーID：${user.server_id}`).join('\n');
                embed.addField('ブラックリストに登録中のユーザー', userList);
            } else {
                embed.addField('ブラックリストに登録中のユーザー', '404 Not Found');
            }

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('エラー:', error);
            const embed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle('エラー')
                .setDescription('データベースの内容を取得できませんでした。');
            await interaction.reply({ embeds: [embed] });
        }
    },
};

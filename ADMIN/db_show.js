const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const {
    getAllBlacklistedUsers,
    getAllBlacklistedServers,
    getAllUserData,
} = require('../db.js');
require('dotenv').config();

const adminUserId = process.env.ADMIN;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin_show_db')
        .setDescription('すべてのデータベースの内容を表示します。管理者のみ使用可能です'),

    async execute(interaction) {
        await interaction.deferReply();

        // 実行ユーザーのIDを取得
        const userId = interaction.user.id;

        // 管理者でない場合はエラーメッセージを送信して終了
        if (userId !== adminUserId) {
            const errorEmbed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle('エラー')
                .setDescription('このコマンドは管理者のみが実行できます。');

            return await interaction.followUp({ embeds: [errorEmbed] });
        }

        try {
            const [blacklistedUsers, blacklistedServers, userData] = await Promise.all([
                getAllBlacklistedUsers(),
                getAllBlacklistedServers(),
                getAllUserData()
            ]);

            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('データベースの内容')
                .addField('ブラックリストに登録されたユーザー', 
                    blacklistedUsers.length ? blacklistedUsers.map(user => `> ID：${user.user_id}, サーバーID：${user.server_id}`).join('\n') : 'データがありません')
                .addField('ブラックリストに登録されたサーバー', 
                    blacklistedServers.length ? blacklistedServers.map(server => `> ID：${server.server_id}`).join('\n') : 'データがありません')
                .addField('ユーザーデータ',
                    userData.length ? userData.map(user => `> ID：${user.user_id}, お金: ${user.money}`).join('\n') : 'データがありません');

            await interaction.followUp({ embeds: [embed] });
        } catch (error) {
            console.error('データベースの取得中にエラーが発生しました:', error);

            const errorEmbed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle('エラー')
                .setDescription('データベースの取得中にエラーが発生しました。');

            await interaction.followUp({ embeds: [errorEmbed] });
        }
    },
};

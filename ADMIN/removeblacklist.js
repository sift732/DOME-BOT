const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { removeUserFromBlacklist, removeServerFromBlacklist } = require('../db');

// 製作者のユーザーIDを取得
const creatorUserId = process.env.ADMIN;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin_removeblacklist')
        .setDescription('ユーザーまたはサーバーをブラックリストから削除します')
        .addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('ユーザーをブラックリストから削除します')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('ブラックリストから削除するユーザー')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('serverid')
                        .setDescription('対象のサーバーID')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('server')
                .setDescription('サーバーをブラックリストから削除します')
                .addStringOption(option =>
                    option.setName('serverid')
                        .setDescription('ブラックリストから削除するサーバーID')
                        .setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // 実行ユーザーが製作者であるか確認
        if (interaction.user.id !== creatorUserId) {
            const embed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle('アクセスエラー')
                .setDescription('このコマンドは製作者のみ実行できます。');
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (subcommand === 'user') {
            const user = interaction.options.getUser('target');
            const serverId = interaction.options.getString('serverid');

            try {
                const result = await removeUserFromBlacklist(user.id, serverId);
                if (result.changes === 0) {
                    throw new Error('ユーザーはブラックリストに登録されていません。');
                }
                const embed = new MessageEmbed()
                    .setColor('#00ff00')
                    .setTitle('成功')
                    .setDescription(`${user.tag} がサーバーID ${serverId} のブラックリストから削除されました。`);
                await interaction.reply({ embeds: [embed] });
            } catch (error) {
                console.error('エラー:', error);
                const embed = new MessageEmbed()
                    .setColor('#ff0000')
                    .setTitle('エラー')
                    .setDescription(`ユーザーをブラックリストから削除できませんでした。理由: ${error.message}`);
                await interaction.reply({ embeds: [embed] });
            }
        } else if (subcommand === 'server') {
            const serverId = interaction.options.getString('serverid');

            try {
                const result = await removeServerFromBlacklist(serverId);
                if (result.changes === 0) {
                    throw new Error('サーバーはブラックリストに登録されていません。');
                }
                const embed = new MessageEmbed()
                    .setColor('#00ff00')
                    .setTitle('成功')
                    .setDescription(`サーバーID ${serverId} がブラックリストから削除されました。`);
                await interaction.reply({ embeds: [embed] });
            } catch (error) {
                console.error('エラー:', error);
                const embed = new MessageEmbed()
                    .setColor('#ff0000')
                    .setTitle('エラー')
                    .setDescription(`サーバーをブラックリストから削除できませんでした。理由: ${error.message}`);
                await interaction.reply({ embeds: [embed] });
            }
        }
    },
};
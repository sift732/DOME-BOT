const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { addUserToBlacklist, addServerToBlacklist, isUserBlacklisted, isServerBlacklisted } = require('../db');

// 製作者のユーザーIDを取得
const creatorUserId = process.env.ADMIN;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin_blacklist')
        .setDescription('ユーザーまたはサーバーをブラックリストに追加します')
        .addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('ユーザーをブラックリストに追加します')
                .addUserOption(option =>
                    option.setName('ターゲット')
                        .setDescription('ブラックリストに追加するユーザー')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('server_id')
                        .setDescription('対象のサーバーID')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('server')
                .setDescription('サーバーをブラックリストに追加します')
                .addStringOption(option =>
                    option.setName('server_id')
                        .setDescription('ブラックリストに追加するサーバーID')
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
            const user = interaction.options.getUser('ターゲット');
            const serverId = interaction.options.getString('サーバーID');

            try {
                const blacklisted = await isUserBlacklisted(user.id, serverId);
                if (blacklisted) {
                    const embed = new MessageEmbed()
                        .setColor('#ff0000')
                        .setTitle('エラー')
                        .setDescription(`${user.tag} は既にサーバーID ${serverId} のブラックリストに追加されています。`);
                    await interaction.reply({ embeds: [embed] });
                } else {
                    await addUserToBlacklist(user.id, serverId);
                    const embed = new MessageEmbed()
                        .setColor('#00ff00')
                        .setTitle('成功')
                        .setDescription(`${user.tag} がサーバーID ${serverId} のブラックリストに追加されました。`);
                    await interaction.reply({ embeds: [embed] });
                }
            } catch (error) {
                console.error('エラー:', error);
                const embed = new MessageEmbed()
                    .setColor('#ff0000')
                    .setTitle('エラー')
                    .setDescription('ユーザーをブラックリストに追加できませんでした。');
                await interaction.reply({ embeds: [embed] });
            }
        } else if (subcommand === 'server') {
            const serverId = interaction.options.getString('サーバーID');

            try {
                const blacklisted = await isServerBlacklisted(serverId);
                if (blacklisted) {
                    const embed = new MessageEmbed()
                        .setColor('#ff0000')
                        .setTitle('エラー')
                        .setDescription(`サーバーID ${serverId} は既にブラックリストに追加されています。`);
                    await interaction.reply({ embeds: [embed] });
                } else {
                    await addServerToBlacklist(serverId);
                    const embed = new MessageEmbed()
                        .setColor('#00ff00')
                        .setTitle('成功')
                        .setDescription(`サーバーID ${serverId} がブラックリストに追加されました。`);
                    await interaction.reply({ embeds: [embed] });
                }
            } catch (error) {
                console.error('エラー:', error);
                const embed = new MessageEmbed()
                    .setColor('#ff0000')
                    .setTitle('エラー')
                    .setDescription('サーバーをブラックリストに追加できませんでした。');
                await interaction.reply({ embeds: [embed] });
            }
        }
    },
};
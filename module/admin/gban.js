const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { addGlobalBan } = require('../../db/managedb');
const dotenv = require('dotenv');

dotenv.config();

const ADMIN_ID = process.env.ADMINID;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin_globalban')
        .setDescription('グローバルBANを実行します')
        .addStringOption(option =>
            option.setName('ユーザーid')
                .setDescription('BANするユーザーのID')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('理由')
                .setDescription('BANの理由')
                .setRequired(true)),
    
    async execute(interaction) {
        if (interaction.user.id !== ADMIN_ID) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ff0000')
                        .setAuthor({
                            name: '権限エラー',
                            iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless'
                        })
                        .setDescription('このコマンドは製作者のみ実行可能です。')
                ],
                ephemeral: true
            });
        }

        const userId = interaction.options.getString('ユーザーid');
        const reason = interaction.options.getString('理由');

        try {
            await addGlobalBan(userId, reason);
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#00ff00')
                        .setAuthor({
                            name: 'グローバルBAN成功',
                            iconURL: 'https://cdn.discordapp.com/emojis/1269391024472592424.webp?size=96&quality=lossless'
                        })
                        .setDescription(`ユーザーID：${userId} をグローバルBANしました。\n理由：${reason}`)
                ]
            });
        } catch (error) {
            console.error('グローバルBANエラー:', error);
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ff0000')
                        .setAuthor({
                            name: 'エラー',
                            iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless'
                        })
                        .setDescription('グローバルBANの処理中にエラーが発生しました。')
                ]
            });
        }
    }
};

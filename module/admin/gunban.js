const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { removeGlobalBan } = require('../../db/managedb');
const dotenv = require('dotenv');

dotenv.config();

const ADMIN_ID = process.env.ADMINID;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin_ungban')
        .setDescription('グローバルBANを解除します')
        .addStringOption(option =>
            option.setName('ユーザーid')
                .setDescription('BAN解除するユーザーのID')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('理由')
                .setDescription('解除の理由')
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
            await removeGlobalBan(userId);
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#00ff00')
                        .setAuthor({
                            name: 'グローバルBAN解除成功',
                            iconURL: 'https://cdn.discordapp.com/emojis/1269391024472592424.webp?size=96&quality=lossless' // アイコンURLも追加
                        })
                        .setDescription(`ユーザーID: ${userId} のグローバルBANが解除されました。\n理由: ${reason}`)
                ]
            });
        } catch (error) {
            console.error('グローバルBAN解除エラー:', error);
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ff0000')
                        .setAuthor({
                            name: 'エラー',
                            iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' // アイコンURLも追加
                        })
                        .setDescription('グローバルBAN解除の処理中にエラーが発生しました。')
                ]
            });
        }
    }
};

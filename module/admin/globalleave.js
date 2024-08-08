const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { removeGlobalChatServer } = require('../../db/managedb');
const dotenv = require('dotenv');

dotenv.config();

const ADMIN_ID = process.env.ADMINID;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin_globalleave')
        .setDescription('指定されたサーバーIDのグローバルチャット情報を削除します')
        .addStringOption(option =>
            option.setName('サーバーid')
                .setDescription('削除するサーバーのID')
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

        const serverId = interaction.options.getString('サーバーid');

        try {
            await removeGlobalChatServer(serverId);
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#00ff00')
                        .setAuthor({
                            name: 'グローバルチャット情報削除成功',
                            iconURL: 'https://cdn.discordapp.com/emojis/1269391024472592424.webp?size=96&quality=lossless'
                        })
                        .setDescription(`サーバーID：${serverId} のグローバルチャット情報が削除されました。`)
                ]
            });
        } catch (error) {
            console.error('グローバルチャット情報削除エラー:', error);
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ff0000')
                        .setAuthor({
                            name: 'エラー',
                            iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' // アイコンURLも追加
                        })
                        .setDescription('グローバルチャット情報削除の処理中にエラーが発生しました。')
                ]
            });
        }
    }
};

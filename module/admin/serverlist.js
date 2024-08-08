const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin_serverlist')
        .setDescription('ボットが導入されているサーバーのリストを表示します'),

    async execute(interaction) {
        const adminId = process.env.ADMINID;
        
        if (interaction.user.id !== adminId) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' })
                .setDescription('このコマンドは実行できません。');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const client = interaction.client;
        const serverList = client.guilds.cache.map(guild => `${guild.name} (${guild.id})`).join('\n');

        if (serverList.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' })
                .setDescription('ボットが導入されているサーバーがありません。');
            return interaction.reply({ embeds: [embed] });
        }

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setAuthor({ name: 'サーバーリスト', iconURL: 'https://cdn.discordapp.com/emojis/1269391024472592424.webp?size=96&quality=lossless' })
            .setDescription(serverList || 'サーバーが見つかりません');

        return interaction.reply({ embeds: [embed] });
    },
};

const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin_serverinfo')
        .setDescription('指定したサーバーの情報を表示します')
        .addStringOption(option => 
            option.setName('id')
                .setDescription('サーバーのID')
                .setRequired(true)
        ),

    async execute(interaction) {
        const adminId = process.env.ADMINID;
        
        if (interaction.user.id !== adminId) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' })
                .setDescription('このコマンドは実行できません。');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const serverId = interaction.options.getString('id');
        const server = interaction.client.guilds.cache.get(serverId);

        if (!server) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' })
                .setDescription('指定されたサーバーが見つかりません。');
            return interaction.reply({ embeds: [embed] });
        }

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setAuthor({ name: server.name, iconURL: server.iconURL() })
            .addFields(
                { name: 'サーバー名', value: server.name, inline: true },
                { name: 'サーバーID', value: server.id, inline: true },
                { name: 'メンバー数', value: `${server.memberCount}`, inline: true },
                { name: '所有者', value: `${await server.fetchOwner().then(owner => owner.user.tag)}`, inline: true },
                { name: '導入日', value: `<t:${Math.floor(server.joinedTimestamp / 1000)}:D>`, inline: true },
                { name: 'ロール数', value: `${server.roles.cache.size}`, inline: true },
                { name: 'サーバー作成日', value: `<t:${Math.floor(server.createdTimestamp / 1000)}:D>`, inline: true }
            );

        return interaction.reply({ embeds: [embed] });
    },
};

const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server_list')
        .setDescription('Botが導入されているサーバー名とサーバーIDを表示します。'),
    async execute(interaction) {
        try {
            // Check if user has ADMIN permission
            const adminUser = process.env.ADMIN; // Load ADMIN user ID from environment variable

            if (interaction.user.id !== adminUser) {
                const errorEmbed = new MessageEmbed()
                    .setColor('#ff0000')
                    .setTitle('エラー')
                    .setDescription('このコマンドは管理者のみが実行できます。')
                    .setTimestamp();
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            // Collect guild names and IDs
            const guildList = interaction.client.guilds.cache.map(guild => `${guild.name} (${guild.id})`);

            // Create embed for server list
            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('導入されているサーバー一覧')
                .setDescription(guildList.join('\n'));

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('サーバーリストの取得中にエラーが発生しました:', error);

            const errorEmbed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle('エラー')
                .setDescription('サーバーリストの取得に失敗しました。')
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};

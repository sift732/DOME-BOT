const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music_restart')
        .setDescription('一時停止している音楽を再開します'),

    async execute(interaction) {
        const guildId = interaction.guildId;
        const manager = interaction.client.manager;

        try {
            const player = manager.players.get(guildId);

            if (!player || !player.paused) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' })
                    .setDescription('現在音楽が一時停止されていません');
                return interaction.reply({ embeds: [embed] });
            }

            player.pause(false);

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setAuthor({ name: '成功', iconURL: 'https://cdn.discordapp.com/emojis/1269391024472592424.webp?size=96&quality=lossless' })
                .setDescription('一時停止中の音楽を再開しました');
            return interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('音楽の再開中にエラーが発生しました:', error);
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' })
                .setDescription('音楽の再開中にエラーが発生しました');
            return interaction.reply({ embeds: [embed] });
        }
    },
};

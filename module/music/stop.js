const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music_stop')
        .setDescription('再生中の音楽を一時停止します'),

    async execute(interaction) {
        const guildId = interaction.guildId;
        const manager = interaction.client.manager;

        try {
            const player = manager.players.get(guildId);

            if (!player || !player.playing) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' })
                    .setDescription('現在音楽が再生されていません');
                return interaction.reply({ embeds: [embed] });
            }

            player.pause(true);

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setAuthor({ name: '成功', iconURL: 'https://cdn.discordapp.com/emojis/1269391024472592424.webp?size=96&quality=lossless' })
                .setDescription('現在の音楽を一時停止しました');
            return interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('音楽の一時停止中にエラーが発生しました:', error);
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' })
                .setDescription('音楽の停止中にエラーが発生しました');
            return interaction.reply({ embeds: [embed] });
        }
    },
};

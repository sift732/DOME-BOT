const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music_repause')
        .setDescription('一時停止している音楽を再開します'),

    async execute(interaction) {
        const guildId = interaction.guildId;
        const manager = interaction.client.manager;

        try {
            const player = manager.players.get(guildId);

            if (!player || !player.paused) {
                const embed = new MessageEmbed()
                    .setColor('RED')
                    .setAuthor('エラー','https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/error1.gif')
                    .setDescription('現在音楽が一時停止されていません');
                return interaction.reply({ embeds: [embed] });
            }

            player.pause(false);

            const embed = new MessageEmbed()
                .setColor('GREEN')
                .setAuthor('成功','https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/success.png')
                .setDescription('一時停止中の音楽を再開しました');
            interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('An error occurred in repause command:', error);
            const embed = new MessageEmbed()
                .setColor('RED')
                .setAuthor('エラー','https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/error1.gif')
                .setDescription('音楽の再開中にエラーが発生しました');
            interaction.reply({ embeds: [embed] });
        }
    },
};

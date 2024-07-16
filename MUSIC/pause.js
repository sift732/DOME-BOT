const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music_pause')
        .setDescription('再生中の音楽を一時停止します'),

    async execute(interaction) {
        const guildId = interaction.guildId;
        const manager = interaction.client.manager;

        try {
            const player = manager.players.get(guildId);

            if (!player || !player.playing) {
                const embed = new MessageEmbed()
                    .setColor('RED')
                    .setAuthor('エラー','https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/error1.gif')
                    .setDescription('現在音楽が再生されていません');
                return interaction.reply({ embeds: [embed] });
            }

            player.pause(true);

            const embed = new MessageEmbed()
                .setColor('GREEN')
                .setAuthor('成功','https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/success.png')
                .setDescription('現在の音楽を一時停止しました');
            interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('An error occurred in stop command:', error);
            const embed = new MessageEmbed()
                .setColor('RED')
                .setAuthor('エラー','https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/error1.gif')
                .setDescription('音楽の停止中にエラーが発生しました');
            interaction.reply({ embeds: [embed] });
        }
    },
};

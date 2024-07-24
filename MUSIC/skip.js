const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music_skip')
        .setDescription('再生中の音楽をスキップして次の曲を再生します'),

    async execute(interaction) {
        const guildId = interaction.guildId;
        const manager = interaction.client.manager;

        try {
            const player = manager.players.get(guildId);

            if (!player) {
                const embed = new MessageEmbed()
                    .setColor('RED')
                    .setAuthor('エラー','https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/error1.gif')
                    .setDescription('音楽が再生されていません');
                return interaction.reply({ embeds: [embed] });
            }

            if (player.queue.size === 0 || !player.queue.current) {
                const embed = new MessageEmbed()
                    .setColor('RED')
                    .setAuthor('エラー','https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/error1.gif')
                    .setDescription('次の曲が存在しません');
                return interaction.reply({ embeds: [embed] });
            }

            player.stop();
            const embed = new MessageEmbed()
                .setColor('GREEN')
                .setAuthor('成功','https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/success.png')
                .setDescription('現在の曲をスキップし、次の曲を再生します');
            interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('An error occurred in skip command:', error);
            const embed = new MessageEmbed()
                .setColor('RED')
                .setAuthor('エラー','https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/error1.gif')
                .setDescription('スキップ中にエラーが発生しました');
            interaction.reply({ embeds: [embed] });
        }
    },
};

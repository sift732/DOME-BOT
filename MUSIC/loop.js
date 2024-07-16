const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music_loop')
        .setDescription('現在再生中の曲をループします'),

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

            if (!player.queue.current) {
                const embed = new MessageEmbed()
                    .setColor('RED')
                    .setAuthor('エラー','https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/error1.gif')
                    .setDescription('再生中の曲がありません');
                return interaction.reply({ embeds: [embed] });
            }

            player.setTrackRepeat(!player.trackRepeat);

            const embed = new MessageEmbed()
                .setColor('GREEN')
                .setAuthor('ループ','https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/success.png')
                .setDescription(`現在の曲のループが${player.trackRepeat ? '有効' : '無効'}になりました`);
            interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('An error occurred in loop command:', error);
            const embed = new MessageEmbed()
                .setColor('RED')
                .setAuthor('エラー','https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/error1.gif')
                .setDescription('ループの設定中にエラーが発生しました');
            interaction.reply({ embeds: [embed] });
        }
    },
};

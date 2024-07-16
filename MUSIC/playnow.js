const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music_now')
        .setDescription('現在再生中の曲のリンクを表示します'),

    async execute(interaction) {
        const guildId = interaction.guildId;
        const manager = interaction.client.manager;
        const player = manager.players.get(guildId);

        if (!player || !player.queue.current) {
            const embed = new MessageEmbed()
                .setColor('RED')
                .setTitle('エラー')
                .setDescription('現在再生中の曲はありません');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const track = player.queue.current;
        const embed = new MessageEmbed()
            .setColor('GREEN')
            .setTitle('現在再生中の曲')
            .setDescription(`再生中：**[${track.title}](${track.uri})**`)
            .addField('アップロード者', track.author || '不明', true)
            .addField('再生時間', formatDuration(track.duration), true);

        if (track.thumbnail) {
            embed.setThumbnail(track.thumbnail);
        } else {
            embed.setThumbnail('https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/speaker.gif');
        }

        await interaction.reply({ embeds: [embed] });
    },
};

function formatDuration(duration) {
    const seconds = Math.floor((duration / 1000) % 60);
    const minutes = Math.floor((duration / (1000 * 60)) % 60);
    const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    const hoursStr = (hours < 10) ? `0${hours}` : hours;
    const minutesStr = (minutes < 10) ? `0${minutes}` : minutes;
    const secondsStr = (seconds < 10) ? `0${seconds}` : seconds;

    return `${hoursStr}:${minutesStr}:${secondsStr}`;
}
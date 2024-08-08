const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music_operation')
        .setDescription('指定した時間まで音楽をスキップします')
        .addStringOption(option =>
            option.setName('時間')
                .setDescription('スキップする時間を「hh:mm:ss」,「mm:ss」または「ss」形式で指定します')
                .setRequired(true)
        ),

    async execute(interaction) {
        const guildId = interaction.guildId;
        const timeInput = interaction.options.getString('時間');
        const player = interaction.client.manager.players.get(guildId);

        if (!player || !player.playing) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' })
                .setDescription('現在、再生中の曲がありません。');
            return interaction.reply({ embeds: [embed] });
        }

        const track = player.queue.current;
        const trackDuration = track.duration; 
        const timeInSeconds = parseTimeToSeconds(timeInput);
        const timeInMilliseconds = timeInSeconds * 1000;

        if (isNaN(timeInMilliseconds) || timeInMilliseconds > trackDuration) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' })
                .setDescription('指定した時間が曲の長さを超えています。');
            return interaction.reply({ embeds: [embed] });
        }

        const seekPosition = timeInMilliseconds;
        player.seek(seekPosition);

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setAuthor({ name: 'スキップ完了', iconURL: 'https://cdn.discordapp.com/emojis/1269391024472592424.webp?size=96&quality=lossless' })
            .setDescription(`曲の最初から ${formatDuration(timeInSeconds)} までスキップされました。`);
        return interaction.reply({ embeds: [embed] });
    },
};

function parseTimeToSeconds(time) {
    const parts = time.split(':').map(part => parseInt(part, 10));
    
    if (parts.length === 1) {
        return parts[0];
    } else if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return NaN;
}

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}

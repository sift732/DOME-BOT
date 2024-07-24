const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('operation')
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
            const embed = new MessageEmbed()
                .setColor('RED')
                .setTitle('エラー')
                .setDescription('現在、再生中の曲がありません。');
            return interaction.reply({ embeds: [embed] });
        }

        const track = player.queue.current;
        const trackDuration = track.duration; // トラックの全体の長さ
        const timeInSeconds = parseTimeToSeconds(timeInput);
        const timeInMilliseconds = timeInSeconds * 1000;

        // 指定した時間が曲の長さを超えているかどうかをチェック
        if (isNaN(timeInMilliseconds) || timeInMilliseconds > trackDuration) {
            const embed = new MessageEmbed()
                .setColor('RED')
                .setTitle('エラー')
                .setDescription('指定した時間が曲の長さを超えています。');
            return interaction.reply({ embeds: [embed] });
        }

        // 曲の最初から指定された時間までスキップ
        const seekPosition = timeInMilliseconds;

        // 曲の最初から指定された時間までスキップ
        player.seek(seekPosition);
        const embed = new MessageEmbed()
            .setColor('GREEN')
            .setTitle('スキップ完了')
            .setDescription(`曲の最初から ${formatDuration(timeInSeconds)} までスキップされました。`);
        return interaction.reply({ embeds: [embed] });
    },
};

// 時間を秒に変換する関数
function parseTimeToSeconds(time) {
    const parts = time.split(':').map(part => parseInt(part, 10));
    
    if (parts.length === 1) {
        return parts[0]; // 秒のみ
    } else if (parts.length === 2) {
        return parts[0] * 60 + parts[1]; // 分:秒
    } else if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2]; // 時間:分:秒
    }
    return NaN;
}

// 秒を「hh:mm:ss」形式にフォーマットする関数
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
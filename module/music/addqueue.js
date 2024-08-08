const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music_addqueue')
        .setDescription('音楽をキューに追加します')
        .addStringOption(option =>
            option.setName('リクエスト')
                .setDescription('URLまたは曲名を指定します')
                .setRequired(true)
        ),

    async execute(interaction) {
        const query = interaction.options.getString('リクエスト');
        const guildId = interaction.guildId;
        const member = interaction.member;
        const manager = interaction.client.manager;

        if (!member.voice.channel) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' })
                .setDescription('ボイスチャンネルに参加してからコマンドを実行してください。');
            return interaction.reply({ embeds: [embed] });
        }

        const voiceChannel = member.voice.channel;

        try {
            console.log(`キュー追加リクエスト：${query}`);
            const results = await manager.search(query, interaction.user);

            if (!results || results.loadType === 'NO_MATCHES') {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' })
                    .setDescription('指定されたURLまたは曲名で音楽が見つかりませんでした');
                return interaction.reply({ embeds: [embed] });
            }

            let player = manager.players.get(guildId);

            if (!player) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' })
                    .setDescription('現在音楽が再生されていません。`/music_play [URL、または曲名]` で音楽の再生を開始してください。');
                return interaction.reply({ embeds: [embed] });
            }

            const track = results.tracks[0];

            if (!track) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' })
                    .setDescription('検索結果に適切な音楽が見つかりませんでした');
                return interaction.reply({ embeds: [embed] });
            }

            await player.queue.add(track);

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setAuthor({ name: 'キューに追加', iconURL: 'https://cdn.discordapp.com/emojis/1269391024472592424.webp?size=96&quality=lossless' })
                .setDescription(`キューに追加：**[${track.title}](${track.uri})**`)
                .addFields(
                    { name: '長さ', value: formatDuration(track.duration / 1000) },
                    { name: 'アップロード者', value: track.author || '不明', inline: true }
                );

            if (track.thumbnail) {
                embed.setThumbnail(track.thumbnail);
            } else {
                embed.setThumbnail('https://cdn.discordapp.com/emojis/1269391026997428338.webp?size=44&quality=lossless');
            }

            interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('An error occurred:', error);
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' })
                .setDescription('音楽をキューに追加できませんでした。数分後に再度実行してください');
            interaction.reply({ embeds: [embed] });
        }
    },
};

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

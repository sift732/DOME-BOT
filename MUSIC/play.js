const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { formatDuration } = require('../utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music_play')
        .setDescription('ボイスチャンネルで音楽を再生します')
        .addStringOption(option =>
            option.setName('song')
                .setDescription('URLまたは曲名を指定します')
                .setRequired(true)
        ),

    async execute(interaction) {
        const query = interaction.options.getString('song');
        const guildId = interaction.guildId;

        const manager = interaction.client.manager;

        try {
            console.log(`検索リクエスト：${query}`);
            const results = await manager.search(query, interaction.user);

            if (!results || results.loadType === 'NO_MATCHES') {
                const embed = new MessageEmbed()
                    .setColor('RED')
                    .setTitle('Error')
                    .setDescription('指定されたURLまたは曲名で音楽が見つかりませんでした');
                return interaction.reply({ embeds: [embed] });
            }

            let player = manager.players.get(guildId);

            if (!player) {
                player = manager.create({
                    guild: guildId,
                    voiceChannel: interaction.member.voice.channel.id,
                    textChannel: interaction.channel.id,
                    volume: 50,
                });

                player.connect();
            }

            const track = results.tracks[0];

            if (!track) {
                const embed = new MessageEmbed()
                    .setColor('RED')
                    .setTitle('Error')
                    .setDescription('検索結果に有効なトラックが見つかりませんでした');
                return interaction.reply({ embeds: [embed] });
            }

            await player.queue.add(track);

            if (!player.playing && !player.paused && !player.queue.size) {
                player.play();

                // 再生が開始されたら経過時間の更新を開始する
                const message = await interaction.reply({ embeds: [createEmbed(track)], fetchReply: true });
                player.nowPlayingMessage = { id: message.id, channelId: message.channel.id, guildId: interaction.guildId };

                // 開始時間を記録し、定期的に経過時間を更新する処理を設定
                const startTime = Date.now();
                const updateInterval = 5000;

                const updateEmbed = () => {
                    const elapsedTime = Date.now() - startTime;
                    const elapsedDuration = formatDuration(elapsedTime);

                    // 経過時間を埋め込みに反映
                    const updatedEmbed = createEmbed(track, elapsedDuration);
                    message.edit({ embeds: [updatedEmbed] });

                    // 再生が終了したら終了
                    if (elapsedTime >= track.duration) {
                        clearInterval(interval);
                    }
                };

                // 定期的に更新するインターバルを設定
                const interval = setInterval(updateEmbed, updateInterval);

                // playerオブジェクトにインターバルを保存しておく
                player.updateInterval = interval;
            } else {
                const embed = new MessageEmbed()
                    .setColor('GREEN')
                    .setAuthor({ name: 'キューに追加', iconURL: 'https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/quue.gif' })
                    .setDescription(`キューに追加：**[${track.title}](${track.uri})**`)
                    .addFields(
                        { name: 'アップロード者', value: track.author || '不明', inline: true },
                        { name: '再生時間', value: formatDuration(track.duration), inline: true }
                    );

                if (track.thumbnail) {
                    embed.setThumbnail(track.thumbnail);
                } else {
                    embed.setThumbnail('https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/speaker.gif');
                }

                interaction.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('An error occurred:', error);
            const embed = new MessageEmbed()
                .setColor('RED')
                .setAuthor({ name: 'エラー', iconURL: 'https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/error1.gif' })
                .setDescription('音楽を再生できませんでした。数分後に再度実行してください');
            interaction.reply({ embeds: [embed] });
        }
    },
};

// Embed 作成関数
function createEmbed(track, elapsedDuration = '0:00:00') {
    return new MessageEmbed()
        .setColor('GREEN')
        .setAuthor({ name: '再生中', iconURL: 'https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/play.gif' })
        .setDescription(`再生中：**[${track.title}](${track.uri})**`)
        .addFields(
            { name: 'アップロード者', value: track.author || '不明', inline: true },
            {
                name: '経過時間(5秒ごと) / 動画の長さ',
                value: `${elapsedDuration} / ${formatDuration(track.duration)}`,
                inline: true
            }
        )
        .setThumbnail(track.thumbnail || 'https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/speaker.gif');
}

async function startUpdatingElapsedTime(player, track, interaction) {
    const startTime = Date.now();
    const updateInterval = 5000;

    const updateEmbed = () => {
        const elapsedTime = Date.now() - startTime;
        const elapsedDuration = formatDuration(elapsedTime);

        const updatedEmbed = createEmbed(track, elapsedDuration);
        player.nowPlayingMessage.channel.send({ embeds: [updatedEmbed] });

        if (elapsedTime >= track.duration) {
            clearInterval(interval);
        }
    };

    const interval = setInterval(updateEmbed, updateInterval);
    player.updateInterval = interval;
}
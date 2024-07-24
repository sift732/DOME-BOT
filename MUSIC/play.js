const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

let nowPlayingMessages = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music_play')
        .setDescription('ボイスチャンネルで音楽を再生します')
        .addStringOption(option =>
            option.setName('リクエスト')
                .setDescription('URLまたは曲名を指定します')
                .setRequired(true)
        ),

    async execute(interaction) {
        const query = interaction.options.getString('リクエスト');
        const guildId = interaction.guildId;
        const member = interaction.member;

        if (!member.voice.channel) {
            const embed = new MessageEmbed()
                .setColor('RED')
                .setTitle('エラー')
                .setDescription('ボイスチャンネルに参加してからコマンドを実行してください。');
            return interaction.reply({ embeds: [embed] });
        }

        const voiceChannel = member.voice.channel;
        const manager = interaction.client.manager;

        try {
            console.log(`検索リクエスト：${query}`);
            const results = await manager.search(query, interaction.user);

            if (!results || results.loadType === 'NO_MATCHES') {
                const embed = new MessageEmbed()
                    .setColor('RED')
                    .setTitle('エラー')
                    .setDescription('指定されたURLまたは曲名で音楽が見つかりませんでした');
                return interaction.reply({ embeds: [embed] });
            }

            let player = manager.players.get(guildId);

            if (!player) {
                player = manager.create({
                    guild: guildId,
                    voiceChannel: voiceChannel.id,
                    textChannel: interaction.channel.id,
                    volume: 50,
                });

                player.connect();
            }

            const track = results.tracks[0];

            if (!track) {
                const embed = new MessageEmbed()
                    .setColor('RED')
                    .setTitle('エラー')
                    .setDescription('検索結果に有効なトラックが見つかりませんでした');
                return interaction.reply({ embeds: [embed] });
            }

            if (player.playing && player.queue.size) {
                const embed = new MessageEmbed()
                    .setColor('YELLOW')
                    .setTitle('情報')
                    .setDescription('現在再生中の曲があります。新しい曲をキューに追加するには、/music_addqueue コマンドを使用してください。');
                return interaction.reply({ embeds: [embed] });
            }

            await player.queue.add(track);

            if (!player.playing && !player.paused && !player.queue.size) {
                player.play();

                const message = await interaction.reply({ embeds: [createEmbed(track)], fetchReply: true });
                nowPlayingMessages.set(guildId, { id: message.id, channelId: message.channel.id });

                monitorVoiceChannel(player, interaction.client);
            }
        } catch (error) {
            console.error('エラーが発生しました:', error);
            const embed = new MessageEmbed()
                .setColor('RED')
                .setAuthor({ name: 'エラー', iconURL: 'https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/error1.gif' })
                .setDescription('音楽を再生できませんでした。数分後に再度実行してください');
            interaction.reply({ embeds: [embed] });
        }
    },
};

function createEmbed(track) {
    return new MessageEmbed()
        .setColor('GREEN')
        .setAuthor({ name: '再生中', iconURL: 'https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/play.gif' })
        .setDescription(`再生中：**[${track.title}](${track.uri})**`)
        .addFields(
            { name: 'アップロード者', value: track.author || '不明', inline: true },
            { name: '長さ', value: formatDuration(track.duration / 1000) }
        )
        .setThumbnail(track.thumbnail || 'https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/speaker.gif');
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

function monitorVoiceChannel(player, client) {
    client.on('voiceStateUpdate', (oldState, newState) => {
        if (oldState.guild.id !== player.guild) return;
        if (oldState.channelId !== newState.channelId) {
            if (oldState.channel && oldState.channel.members.size === 1 && oldState.channel.members.has(client.user.id)) {
                const botPlayer = client.manager.players.get(player.guild);
                if (botPlayer) {
                    botPlayer.stop();
                    botPlayer.destroy();

                    const nowPlaying = nowPlayingMessages.get(player.guild);
                    if (nowPlaying) {
                        const channel = client.channels.cache.get(nowPlaying.channelId);
                        if (channel) {
                            const embed = new MessageEmbed()
                                .setColor('RED')
                                .setTitle('離脱')
                                .setDescription('VCに誰もいなくなったため、自動で退出しました。');

                            channel.send({ embeds: [embed] });
                        } else {
                            console.error(`チャンネルが見つかりませんでした: ${nowPlaying.channelId}`);
                        }
                    } else {
                        console.error('nowPlayingMessagesからの情報が取得できませんでした');
                    }
                    nowPlayingMessages.delete(player.guild);
                }
            }
        }
    });
}
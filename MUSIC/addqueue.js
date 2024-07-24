const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

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
            const embed = new MessageEmbed()
                .setColor('RED')
                .setTitle('エラー')
                .setDescription('ボイスチャンネルに参加してからコマンドを実行してください。');
            return interaction.reply({ embeds: [embed] });
        }

        const voiceChannel = member.voice.channel;

        try {
            console.log(`キュー追加リクエスト：${query}`);
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
                const embed = new MessageEmbed()
                    .setColor('RED')
                    .setTitle('エラー')
                    .setDescription('現在音楽が再生されていません。');
                return interaction.reply({ embeds: [embed] });
            }

            const track = results.tracks[0];

            if (!track) {
                const embed = new MessageEmbed()
                    .setColor('RED')
                    .setTitle('エラー')
                    .setDescription('検索結果に有効なトラックが見つかりませんでした');
                return interaction.reply({ embeds: [embed] });
            }

            await player.queue.add(track);

            const embed = new MessageEmbed()
                .setColor('GREEN')
                .setTitle('キューに追加')
                .setDescription(`キューに追加：**[${track.title}](${track.uri})**`)
                .addFields(
                    { name: 'アップロード者', value: track.author || '不明', inline: true }
                );

            if (track.thumbnail) {
                embed.setThumbnail(track.thumbnail);
            } else {
                embed.setThumbnail('https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/speaker.gif');
            }

            interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('An error occurred:', error);
            const embed = new MessageEmbed()
                .setColor('RED')
                .setTitle('エラー')
                .setDescription('音楽をキューに追加できませんでした。数分後に再度実行してください');
            interaction.reply({ embeds: [embed] });
        }
    },
};

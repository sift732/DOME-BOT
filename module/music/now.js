const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music_now')
        .setDescription('現在再生中の曲の情報を表示します'),

    async execute(interaction) {
        const guildId = interaction.guildId;
        const player = interaction.client.manager.players.get(guildId);

        if (!player || !player.playing) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: '再生中の曲がありません', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' })
                .setDescription('現在、再生中の曲がありません。');
            return interaction.reply({ embeds: [embed] });
        }

        const track = player.queue.current;

        const nowPlayingEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setAuthor({ name: '現在再生中の曲', iconURL: 'https://cdn.discordapp.com/emojis/1269391024472592424.webp?size=96&quality=lossless' })
            .setDescription(`**曲名**: [${track.title}](${track.uri})\n` +
                            `**アップロード者**: ${track.author}`)
            .setFooter({ text: `リクエスト者: ${track.requester.tag}` });

        return interaction.reply({ embeds: [nowPlayingEmbed] });
    },
};

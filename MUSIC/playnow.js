const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music_now')
        .setDescription('現在再生中の曲の情報を表示します'),

    async execute(interaction) {
        const guildId = interaction.guildId;
        const player = interaction.client.manager.players.get(guildId);

        if (!player || !player.playing) {
            const embed = new MessageEmbed()
                .setColor('RED')
                .setTitle('再生中の曲がありません')
                .setDescription('現在、再生中の曲がありません。');
            return interaction.reply({ embeds: [embed] });
        }

        const track = player.queue.current;

        const nowPlayingEmbed = new MessageEmbed()
            .setColor('GREEN')
            .setTitle('現在再生中の曲')
            .setDescription(`**曲名**: [${track.title}](${track.uri})\n` +
                            `**アップロード者**: ${track.author}`)
            .setFooter({ text: `リクエスト者: ${track.requester.tag}` });

        return interaction.reply({ embeds: [nowPlayingEmbed] });
    },
};
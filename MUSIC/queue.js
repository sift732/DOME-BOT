const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music_queue')
        .setDescription('キューに追加された曲のリストを表示します'),

    async execute(interaction) {
        const guildId = interaction.guildId;
        const player = interaction.client.manager.players.get(guildId);

        if (!player || player.queue.size === 0) {
            const embed = new MessageEmbed()
                .setColor('RED')
                .setTitle('キューは空です')
                .setDescription('現在、キューに曲が追加されていません。');
            return interaction.reply({ embeds: [embed] });
        }

        const queueEmbed = new MessageEmbed()
            .setColor('BLUE')
            .setTitle('キューに追加された曲')
            .setDescription('以下は現在キューに追加されている曲のリストです');

        let trackNumber = 1;
        player.queue.forEach((track) => {
            queueEmbed.addField(
                `曲 ${trackNumber++}: ${track.title}`,
                `[リンク](${track.uri})\nリクエスト者: ${track.requester.tag}`,
                false
            );
            queueEmbed.addField('\u200B', '----------------------------------------', false);
        });

        return interaction.reply({ embeds: [queueEmbed] });
    },
};
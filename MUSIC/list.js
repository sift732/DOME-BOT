const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music_list')
        .setDescription('現在のキューを表示します'),

    async execute(interaction) {
        const query = interaction.options.getString('song');
        const guildId = interaction.guildId;

        const manager = interaction.client.manager;
        let player = manager.players.get(guildId);

        if (!player) {
            const embedNoQueue = new MessageEmbed()
                .setColor('RED')
                .setAuthor('エラー','https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/error1.gif')
                .setDescription('再生中の曲はありません');

            return interaction.reply({ embeds: [embedNoQueue] });
        }

        let queue = player.queue;
        let queueList = queue.map((track, index) => {
            return `${index + 1}. ${track.title}`;
        });

        // 先頭に現在再生中の曲を追加
        queueList.unshift(`**現在再生中の曲:** ${player.queue.current.title}`);

        const embed = new MessageEmbed()
            .setColor('GREEN')
            .setAuthor('キュー一覧', 'https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/success.png')
            .setDescription(queueList.join('\n'));

        return interaction.reply({ embeds: [embed] });
    },
};

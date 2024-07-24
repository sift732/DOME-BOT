const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server_messagecount')
        .setDescription('指定されたチャンネルのメッセージ数を表示します。')
        .addChannelOption(option =>
            option.setName('チャンネル')
                .setDescription('メッセージ数をカウントするチャンネル')
                .setRequired(false)
        ),
    async execute(interaction) {
        const channel = interaction.options.getChannel('チャンネル') || interaction.channel;

        if (channel.type === 'GUILD_VOICE') {
            const embed = new MessageEmbed()
                .setColor('#FF0000')
                .setDescription('ボイスチャンネルは対象外です');
            return interaction.reply({ embeds: [embed] });
        }

        const measuringEmbed = new MessageEmbed()
            .setColor('#FFFF00')
            .setDescription('計測中...');

        const measuringMessage = await interaction.reply({ embeds: [measuringEmbed], fetchReply: true });

        try {
            let messageCount = 0;
            let lastMessageId;

            while (true) {
                const options = { limit: 100 };
                if (lastMessageId) {
                    options.before = lastMessageId;
                }

                const messages = await channel.messages.fetch(options);
                messageCount += messages.size;

                if (messages.size !== 100) {
                    break;
                }

                lastMessageId = messages.last().id;
            }

            const resultEmbed = new MessageEmbed()
                .setColor('#00FF00')
                .setTitle('メッセージカウント')
                .setDescription(`#${channel.name} のメッセージ数は ${messageCount} です。`);

            await measuringMessage.edit({ embeds: [resultEmbed] });
        } catch (error) {
            console.error(error);
            const errorEmbed = new MessageEmbed()
                .setColor('#FF0000')
                .setDescription('メッセージ数を取得中にエラーが発生しました。');
            await measuringMessage.edit({ embeds: [errorEmbed] });
        }
    },
};

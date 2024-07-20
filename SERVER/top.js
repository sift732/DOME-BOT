const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server_topmessage')
        .setDescription('指定されたチャンネルの一番上のメッセージリンクを送信します。')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('メッセージリンクを取得するチャンネル')
                .setRequired(false)
        ),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel') || interaction.channel;

        if (channel.type === 'GUILD_VOICE') {
            const embed = new MessageEmbed()
                .setColor('#FF0000')
                .setDescription('ボイスチャンネルは対象外です。');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        try {
            const messages = await channel.messages.fetch({ limit: 1, after: 0 });
            const firstMessage = messages.first();

            if (!firstMessage) {
                const embed = new MessageEmbed()
                    .setColor('#FF0000')
                    .setDescription('このチャンネルにはメッセージがありません。');
                return interaction.reply({ embeds: [embed] });
            }

            const embed = new MessageEmbed()
                .setColor('#00FF00')
                .setDescription(`指定したチャンネル: ${channel.name}`);

            const button = new MessageButton()
                .setLabel('最初のメッセージを見る')
                .setStyle('LINK')
                .setURL(firstMessage.url)
                .setEmoji('🔗');

            const row = new MessageActionRow().addComponents(button);

            return interaction.reply({ embeds: [embed], components: [row] });
        } catch (error) {
            console.error(error);
            const embed = new MessageEmbed()
                .setColor('#FF0000')
                .setDescription('メッセージを取得中にエラーが発生しました。');
            return interaction.reply({ embeds: [embed] });
        }
    },
};

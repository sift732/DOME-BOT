const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music_leave')
        .setDescription('ボイスチャンネルから離脱します'),

    async execute(interaction) {
        const member = interaction.member;
        const voiceChannelId = member.voice.channelId;
        const manager = interaction.client.manager;

        if (!voiceChannelId) {
            const embedNoVC = new MessageEmbed()
                .setColor('RED')
                .setAuthor('エラー','https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/error1.gif')
                .setDescription('ボイスチャンネルに参加していません。');

            return interaction.reply({ embeds: [embedNoVC], ephemeral: true });
        }

        const voiceChannel = interaction.guild.channels.cache.get(voiceChannelId);

        if (!voiceChannel || voiceChannel.type !== 'GUILD_VOICE') {
            const embedError = new MessageEmbed()
                .setColor('RED')
                .setAuthor('エラー','https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/error1.gif')
                .setDescription('ボイスチャンネルが見つかりませんでした。');

            return interaction.reply({ embeds: [embedError], ephemeral: true });
        }

        try {
            await manager.players.get(interaction.guildId).destroy();

            const embedLeave = new MessageEmbed()
                .setColor('GREEN')
                .setAuthor('成功','https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/success.png')
                .setDescription('ボイスチャンネルから正常に離脱しました。');

            return interaction.reply({ embeds: [embedLeave] });
        } catch (error) {
            console.error('ボイスチャンネルからの離脱中にエラーが発生しました:', error);

            const embedError = new MessageEmbed()
                .setColor('RED')
                .setAuthor('エラー','https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/error1.gif')
                .setDescription('ボイスチャンネルに参加していません');

            return interaction.reply({ embeds: [embedError]});
        }
    },
};

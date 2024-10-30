const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music_leave')
        .setDescription('ボイスチャンネルから離脱します'),

    async execute(interaction) {
        const member = interaction.member;
        const voiceChannelId = member.voice.channelId;
        const manager = interaction.client.manager;

        console.log(`ユーザーが参加しているボイスチャンネルID: ${voiceChannelId}`);

        if (!voiceChannelId) {
            const embedNoVC = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' })
                .setDescription('ボイスチャンネルに参加していません。');

            return interaction.reply({ embeds: [embedNoVC], ephemeral: true });
        }

        const voiceChannel = interaction.guild.channels.cache.get(voiceChannelId);
        console.log(`取得したボイスチャンネル: ${voiceChannel ? voiceChannel.name : '見つかりません'}`);
        if (voiceChannel) {
            console.log(`チャンネルID: ${voiceChannel.id}, 名前: ${voiceChannel.name}, タイプ: ${voiceChannel.type}`);
        }

        if (!voiceChannel || voiceChannel.type !== 2) {
            const embedError = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' })
                .setDescription('ボイスチャンネルが見つかりませんでした。');

            return interaction.reply({ embeds: [embedError], ephemeral: true });
        }

        const player = manager.players.get(interaction.guildId);
        console.log(`取得したプレイヤー: ${player ? '存在する' : '存在しない'}`);
        if (player) {
            console.log(`プレイヤーのボイスチャンネルID: ${player.voiceChannel}`);
        }

        if (!player || player.voiceChannel !== voiceChannelId) {
            const embedNotInPlayerVC = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' })
                .setDescription('プレイヤーがこのボイスチャンネルに接続していません。');

            return interaction.reply({ embeds: [embedNotInPlayerVC], ephemeral: true });
        }

        try {
            console.log('プレイヤーを破棄します...');
            await player.destroy();

            const embedLeave = new EmbedBuilder()
                .setColor('#00ff00')
                .setAuthor({ name: '成功', iconURL: 'https://cdn.discordapp.com/emojis/1269391024472592424.webp?size=96&quality=lossless' })
                .setDescription('ボイスチャンネルから正常に離脱しました。');

            return interaction.reply({ embeds: [embedLeave] });
        } catch (error) {
            console.error('ボイスチャンネルからの離脱中にエラーが発生しました:', error);

            const embedError = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' })
                .setDescription('ボイスチャンネルから離脱できませんでした。');

            return interaction.reply({ embeds: [embedError] });
        }
    },
};

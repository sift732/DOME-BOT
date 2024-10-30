const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music_loop')
        .setDescription('音楽のループ機能を有効または無効にします')
        .addStringOption(option =>
            option.setName('状態')
                .setDescription('ループを有効または無効にします')
                .setRequired(true)
                .addChoices(
                    { name: '有効', value: 'enabled' },
                    { name: '無効', value: 'disabled' },
                    { name: '状態', value: 'status' }
                )
        ),

    async execute(interaction) {
        const loopState = interaction.options.getString('状態');
        const guildId = interaction.guildId;
        const player = interaction.client.manager.players.get(guildId);

        if (!player) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' })
                .setDescription('プレイヤーが存在しません。音楽を再生するには、`/music_play [URLまたは曲名]` を実行してください。');
            return interaction.reply({ embeds: [embed] });
        }

        if (loopState === 'status') {
            const currentLoopState = player.queueRepeat;
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setAuthor({ name: 'ループの状態', iconURL: 'https://cdn.discordapp.com/emojis/1269391024472592424.webp?size=44&quality=lossless' })
                .setDescription(`現在、ループ機能は **${currentLoopState ? '有効' : '無効'}** です。`);
            return interaction.reply({ embeds: [embed] });
        }

        const loop = loopState === 'enabled';
        const currentLoopState = player.queueRepeat;

        if (currentLoopState === loop) {
            const embed = new EmbedBuilder()
                .setColor('#ffff00')
                .setAuthor({ name: 'ループ', iconURL: 'https://cdn.discordapp.com/emojis/1269391024472592424.webp?size=44&quality=lossless' })
                .setDescription(`ループ機能はすでに${loop ? '有効' : '無効'}です。`);
            return interaction.reply({ embeds: [embed] });
        }

        try {
            await player.setQueueRepeat(loop);
            const embed = new EmbedBuilder()
                .setColor(loop ? '#00ff00' : '#ffff00')
                .setAuthor({ name: loop ? '成功' : '情報', iconURL: loop ? 'https://cdn.discordapp.com/emojis/1269391024472592424.webp?size=96&quality=lossless' : 'https://cdn.discordapp.com/emojis/1269391024472592424.webp?size=44&quality=lossless' })
                .setDescription(`ループ機能は ${loop ? '有効' : '無効'} になりました。`);
            interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('ループ機能設定中のエラー:', error);
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' })
                .setDescription('ループ機能を設定できませんでした。');
            interaction.reply({ embeds: [embed] });
        }
    },
};

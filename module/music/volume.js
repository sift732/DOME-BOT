const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music_volume')
        .setDescription('音楽の音量を調整します')
        .addIntegerOption(option => 
            option.setName('レベル')
                .setDescription('音量のレベル (1-100)')
                .setRequired(true)
        ),

    async execute(interaction) {
        const volumeLevel = interaction.options.getInteger('レベル');
        const guildId = interaction.guildId;
        const manager = interaction.client.manager;

        if (volumeLevel < 1 || volumeLevel > 100) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' })
                .setDescription('音量は1から100の間で指定してください');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        try {
            const player = manager.players.get(guildId);

            if (!player) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' })
                    .setDescription('音楽が再生されていません');
                return interaction.reply({ embeds: [embed] });
            }

            player.setVolume(volumeLevel);
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setAuthor({ name: '音量調整', iconURL: 'https://cdn.discordapp.com/emojis/1269391024472592424.webp?size=96&quality=lossless' })
                .setDescription(`音量が **${volumeLevel}%** に設定されました`);
            return interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('An error occurred in volume command:', error);
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' })
                .setDescription('音量を設定中にエラーが発生しました');
            return interaction.reply({ embeds: [embed] });
        }
    },
};

const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

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
            const embed = new MessageEmbed()
                .setColor('RED')
                .setTitle('エラー')
                .setDescription('音量は1から100の間で指定してください');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        try {
            const player = manager.players.get(guildId);

            if (!player) {
                const embed = new MessageEmbed()
                    .setColor('RED')
                    .setAuthor('エラー','https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/error1.gif')
                    .setDescription('音楽が再生されていません');
                return interaction.reply({ embeds: [embed] });
            }

            player.setVolume(volumeLevel);
            const embed = new MessageEmbed()
                .setColor('GREEN')
                .setAuthor('音量調整','https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/success.png')
                .setDescription(`音量が **${volumeLevel}%** に設定されました`);
            interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('An error occurred in volume command:', error);
            const embed = new MessageEmbed()
                .setColor('RED')
                .setAuthor('エラー','https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/error1.gif')
                .setDescription('音量を設定中にエラーが発生しました');
            interaction.reply({ embeds: [embed] });
        }
    },
};

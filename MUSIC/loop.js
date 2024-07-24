const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music_loop')
        .setDescription('現在の曲のループ設定を変更します。')
        .addStringOption(option =>
            option.setName('操作')
                .setDescription('ループの操作 (有効/無効/状態)')
                .setRequired(true)
                .addChoices(
                    { name: '有効', value: 'enable' },
                    { name: '無効', value: 'disable' },
                    { name: '状態', value: 'status' }
                )
        ),

    async execute(interaction) {
        const guildId = interaction.guildId;
        const manager = interaction.client.manager;
        const operation = interaction.options.getString('操作');

        try {
            const player = manager.players.get(guildId);

            if (!player) {
                const embed = new MessageEmbed()
                    .setColor('RED')
                    .setAuthor('エラー', 'https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/error1.gif')
                    .setDescription('音楽が再生されていません');
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            let embed;
            switch (operation) {
                case 'enable':
                    if (player.trackRepeat) {
                        embed = new MessageEmbed()
                            .setColor('RED')
                            .setAuthor('エラー', 'https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/error1.gif')
                            .setDescription('すでにループが有効です');
                    } else {
                        player.setTrackRepeat(true);
                        embed = new MessageEmbed()
                            .setColor('GREEN')
                            .setAuthor('ループ', 'https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/success.png')
                            .setDescription('ループが有効になりました');
                    }
                    break;

                case 'disable':
                    if (!player.trackRepeat) {
                        embed = new MessageEmbed()
                            .setColor('RED')
                            .setAuthor('エラー', 'https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/error1.gif')
                            .setDescription('すでにループが無効です');
                    } else {
                        player.setTrackRepeat(false);
                        embed = new MessageEmbed()
                            .setColor('GREEN')
                            .setAuthor('ループ', 'https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/success.png')
                            .setDescription('ループが無効になりました');
                    }
                    break;

                case 'status':
                    embed = new MessageEmbed()
                        .setColor('GREEN')
                        .setAuthor('ループ状態', 'https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/success.png')
                        .setDescription(`現在のループ設定: ${player.trackRepeat ? '有効' : '無効'}`);
                    break;

                default:
                    embed = new MessageEmbed()
                        .setColor('RED')
                        .setAuthor('エラー', 'https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/error1.gif')
                        .setDescription('無効な操作です');
                    break;
            }

            return interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            console.error('An error occurred in music_loop command:', error);
            const embed = new MessageEmbed()
                .setColor('RED')
                .setAuthor('エラー', 'https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/error1.gif')
                .setDescription('ループの設定中にエラーが発生しました');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};
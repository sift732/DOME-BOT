const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('funny_5000')
        .setDescription('5000兆円ジェネレーターで画像を生成します。')
        .addStringOption(option =>
            option.setName('上の文字')
                .setDescription('画像の上に表示する文字')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('下の文字')
                .setDescription('画像の下に表示する文字')
                .setRequired(true)),
    async execute(interaction) {
        const topText = encodeURIComponent(interaction.options.getString('上の文字'));
        const bottomText = encodeURIComponent(interaction.options.getString('下の文字'));

        try {
            const imageUrl = `https://gsapi.cbrx.io/image?top=${topText}&bottom=${bottomText}&type=png`;

            const successEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setAuthor({ name: '生成しました', iconURL: 'https://cdn.discordapp.com/emojis/1269391024472592424.webp?size=44&quality=lossless' })
                .setImage(imageUrl)
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed] });
        } catch (error) {
            console.error('Image generation error:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: 'エラーが発生しました', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' })
                .setDescription(`エラー内容：${error.message}`)
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed] });
        }
    },
};
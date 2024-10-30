const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('funny_wiki')
        .setDescription('指定したワードの Wikipedia 情報を表示します。')
        .addStringOption(option =>
            option.setName('ワード')
                .setDescription('検索したい Wikipedia のワード')
                .setRequired(true)),

    async execute(interaction) {
        const query = interaction.options.getString('ワード');
        const url = `https://ja.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(query)}&prop=extracts&exintro=true&explaintext=true`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            const pages = data.query.pages;
            const page = Object.values(pages)[0];

            if (page.missing) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391024472592424.webp?size=44&quality=lossless' })
                    .setDescription('指定したワードの情報は見つかりませんでした。')
                    .setTimestamp();

                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }

            const title = page.title;
            const extract = page.extract;

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setAuthor({ name: `Wikipedia：${title}`, iconURL: 'https://cdn.discordapp.com/emojis/1269391024472592424.webp?size=44&quality=lossless' })
                .setDescription(extract)
                .setURL(`https://ja.wikipedia.org/wiki/${encodeURIComponent(title)}`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391024472592424.webp?size=44&quality=lossless' })
                .setDescription('Wikipedia から情報を取得する際にエラーが発生しました。')
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};

const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

// citycode.json のパスを定義し、データを読み込む
const citycodesPath = path.join(__dirname, '../citycode.json');
const citycodes = JSON.parse(fs.readFileSync(citycodesPath, 'utf8'));

// 都道府県のリストを分割
const allPrefectures = Object.keys(citycodes);
const mainPrefectures = allPrefectures.slice(0, 25); // メインコマンドに最大 25 件
const subcommandPrefectures = allPrefectures.slice(25); // 残りの都道府県

// メインコマンドの選択肢を作成
const choices = mainPrefectures.map(prefecture => ({
    name: prefecture,
    value: prefecture
}));

// サブコマンドの選択肢を作成
const subcommandChoices = subcommandPrefectures.map(prefecture => ({
    name: prefecture,
    value: prefecture
}));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('weather')
        .setDescription('県の天気を取得します(市ではありません)')
        .addSubcommand(subcommand =>
            subcommand.setName('main')
                .setDescription('メインの都道府県の天気を取得します')
                .addStringOption(option =>
                    option.setName('都道府県')
                        .setDescription('都道府県を選択してください')
                        .setRequired(true)
                        .addChoices(...choices)))
        .addSubcommand(subcommand =>
            subcommand.setName('other')
                .setDescription('その他の都道府県の天気を取得します')
                .addStringOption(option =>
                    option.setName('都道府県')
                        .setDescription('都道府県を選択してください')
                        .setRequired(true)
                        .addChoices(...subcommandChoices))),
    async execute(interaction) {
        let prefecture;

        if (interaction.options.getSubcommand() === 'other') {
            prefecture = interaction.options.getString('都道府県');
        } else if (interaction.options.getSubcommand() === 'main') {
            prefecture = interaction.options.getString('都道府県');
        } else {
            return interaction.reply('不正なサブコマンドが指定されました。');
        }

        if (citycodes[prefecture]) {
            try {
                const response = await fetch(`https://weather.tsukumijima.net/api/forecast/city/${citycodes[prefecture]}`);
                const res = await response.json();

                // 埋め込みメッセージの作成
                const embed = new MessageEmbed()
                    .setTitle(res.title || '天気情報')
                    .setDescription(res.description ? res.description.headlineText : '情報なし')
                    .setColor(0x0099ff)
                    .setThumbnail(res.copyright && res.copyright.image ? res.copyright.image.url : 'https://example.com/default-icon.png')
                    .addField('今日の天気', `
                        **天気**: ${res.forecasts[0].telop || '情報なし'}
                        **最低気温**: ${res.forecasts[0].temperature.min.celsius ? `${res.forecasts[0].temperature.min.celsius}°C` : '情報なし'}
                        **最高気温**: ${res.forecasts[0].temperature.max.celsius ? `${res.forecasts[0].temperature.max.celsius}°C` : '情報なし'}
                        **風速**: ${res.forecasts[0].detail.wind || '情報なし'}
                        **波高**: ${res.forecasts[0].detail.wave || '情報なし'}
                        **降水確率**:
                            - 朝: ${res.forecasts[0].chanceOfRain.T00_06 || '情報なし'}
                            - 昼: ${res.forecasts[0].chanceOfRain.T06_12 || '情報なし'}
                            - 午後: ${res.forecasts[0].chanceOfRain.T12_18 || '情報なし'}
                            - 夜: ${res.forecasts[0].chanceOfRain.T18_24 || '情報なし'}
                    `, false)
                    .addField('──────────────────', '\u200B', false) // 切り取り線
                    .addField('明日の天気', `
                        **天気**: ${res.forecasts[1].telop || '情報なし'}
                        **最低気温**: ${res.forecasts[1].temperature.min.celsius ? `${res.forecasts[1].temperature.min.celsius}°C` : '情報なし'}
                        **最高気温**: ${res.forecasts[1].temperature.max.celsius ? `${res.forecasts[1].temperature.max.celsius}°C` : '情報なし'}
                        **風速**: ${res.forecasts[1].detail.wind || '情報なし'}
                        **波高**: ${res.forecasts[1].detail.wave || '情報なし'}
                        **降水確率**:
                            - 朝: ${res.forecasts[1].chanceOfRain.T00_06 || '情報なし'}
                            - 昼: ${res.forecasts[1].chanceOfRain.T06_12 || '情報なし'}
                            - 午後: ${res.forecasts[1].chanceOfRain.T12_18 || '情報なし'}
                            - 夜: ${res.forecasts[1].chanceOfRain.T18_24 || '情報なし'}
                    `, false)
                    .addField('──────────────────', '\u200B', false) // 切り取り線
                    .addField('明後日の天気', `
                        **天気**: ${res.forecasts[2].telop || '情報なし'}
                        **最低気温**: ${res.forecasts[2].temperature.min.celsius ? `${res.forecasts[2].temperature.min.celsius}°C` : '情報なし'}
                        **最高気温**: ${res.forecasts[2].temperature.max.celsius ? `${res.forecasts[2].temperature.max.celsius}°C` : '情報なし'}
                        **風速**: ${res.forecasts[2].detail.wind || '情報なし'}
                        **波高**: ${res.forecasts[2].detail.wave || '情報なし'}
                        **降水確率**:
                            - 朝: ${res.forecasts[2].chanceOfRain.T00_06 || '情報なし'}
                            - 昼: ${res.forecasts[2].chanceOfRain.T06_12 || '情報なし'}
                            - 午後: ${res.forecasts[2].chanceOfRain.T12_18 || '情報なし'}
                            - 夜: ${res.forecasts[2].chanceOfRain.T18_24 || '情報なし'}
                    `, false)
                    .setFooter({ text: res.copyright ? `${res.copyright.title}` : '情報提供元: 不明', iconURL: res.copyright && res.copyright.image ? res.copyright.image.url : 'https://example.com/default-icon.png' });

                await interaction.reply({ embeds: [embed] });
            } catch (error) {
                console.error(error);
                const embed = new MessageEmbed()
                    .setTitle("エラー")
                    .setDescription("天気情報の取得中にエラーが発生しました。")
                    .setColor(0xff0000);
                await interaction.reply({ embeds: [embed] });
            }
        } else {
            const embed = new MessageEmbed()
                .setTitle("エラー")
                .setDescription(`${prefecture}の天気は取得できません`)
                .setColor(0xff0000);
            await interaction.reply({ embeds: [embed] });
        }
    }
};
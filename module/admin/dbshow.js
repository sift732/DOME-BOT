const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserBlacklist, getServerBlacklist } = require('../../db/managedb');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin_blacklistshow')
        .setDescription('ブラックリストの内容を表示します。')
        .addStringOption(option =>
            option.setName('種類')
                .setDescription('表示するブラックリストの種類')
                .setRequired(true)
                .addChoices(
                    { name: 'ユーザーブラックリスト', value: 'user' },
                    { name: 'サーバーブラックリスト', value: 'server' }
                )),

    async execute(interaction) {
        const listType = interaction.options.getString('種類');
        const adminId = process.env.ADMINID;

        if (interaction.user.id !== adminId) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: '権限エラー', iconURL: 'https://cdn.discordapp.com/emojis/1267808280005312615.webp?size=96&quality=lossless' })
                .setDescription('このコマンドは製作者専用です');

            await interaction.reply({ embeds: [embed] });
            return;
        }

        try {
            let blacklistData;
            if (listType === 'user') {
                blacklistData = await getUserBlacklist();
            } else if (listType === 'server') {
                blacklistData = await getServerBlacklist();
            }

            if (!blacklistData || blacklistData.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#ff6600')
                    .setAuthor({ name: '情報', iconURL: 'https://cdn.discordapp.com/emojis/1267808282253332481.webp?size=96&quality=lossless' })
                    .setDescription('ブラックリストには登録されていません');

                await interaction.reply({ embeds: [embed] });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle(`${listType === 'user' ? 'ユーザー' : 'サーバー'} ブラックリスト`)
                .setDescription(blacklistData.map(entry => `ID: ${entry.id}\n理由: ${entry.reason}`).join('\n\n'));

            await interaction.reply({ embeds: [embed] });
        } catch (err) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1267808282253332481.webp?size=96&quality=lossless' })
                .setDescription(`ブラックリストの取得中にエラーが発生しました: ${err.message}`);

            await interaction.reply({ embeds: [embed] });
        }
    },
};

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { removeServerFromBlacklist, isServerBlacklisted } = require('../../db/managedb');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin_removeserver')
        .setDescription('ブラックリストからサーバーを削除します。')
        .addStringOption(option => 
            option.setName('サーバーid')
                .setDescription('ブラックリストから削除するサーバーのID')
                .setRequired(true)),

    async execute(interaction) {
        const serverId = interaction.options.getString('サーバーid');
        const adminId = process.env.ADMINID;

        if (interaction.user.id !== adminId) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: '権限エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391025982541937.webp?size=44&quality=lossless' })
                .setDescription('このコマンドは製作者専用です');

            await interaction.reply({ embeds: [embed] });
            return;
        }

        try {
            const isBlacklisted = await isServerBlacklisted(serverId);
            if (!isBlacklisted) {
                const embed = new EmbedBuilder()
                    .setColor('#ffa500')
                    .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1267808282253332481.webp?size=96&quality=lossless' })
                    .setDescription(`サーバーID：${serverId}はブラックリストに登録されていません。`);

                await interaction.reply({ embeds: [embed] });
                return;
            }

            await removeServerFromBlacklist(serverId);

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setAuthor({ name: '削除しました', iconURL: 'https://cdn.discordapp.com/emojis/1269391024472592424.webp?size=44&quality=lossless' })
                .setDescription(`サーバーID: ${serverId}`);

            await interaction.reply({ embeds: [embed] });
        } catch (err) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1267808282253332481.webp?size=96&quality=lossless' })
                .setDescription(`サーバーの削除中にエラーが発生しました：${err.message}`);

            await interaction.reply({ embeds: [embed] });
        }
    },
};

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { removeUserFromBlacklist, isUserBlacklisted } = require('../../db/managedb');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin_removeuser')
        .setDescription('ブラックリストからユーザーを削除します。')
        .addStringOption(option => 
            option.setName('ユーザーid')
                .setDescription('ブラックリストから削除するユーザーのID')
                .setRequired(true)),

    async execute(interaction) {
        const userId = interaction.options.getString('ユーザーid');
        const adminId = process.env.ADMINID;

        if (interaction.user.id !== adminId) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({name:'権限エラー', iconURL:'https://cdn.discordapp.com/emojis/1269391025982541937.webp?size=44&quality=lossless'})
                .setDescription('このコマンドは製作者専用です');

            await interaction.reply({ embeds: [embed] });
            return;
        }

        try {
            const isBlacklisted = await isUserBlacklisted(userId);
            if (!isBlacklisted) {
                const embed = new EmbedBuilder()
                    .setColor('#ff6600')
                    .setAuthor({name:'エラー', iconURL:'https://cdn.discordapp.com/emojis/1267808282253332481.webp?size=96&quality=lossless'})
                    .setDescription(`ユーザーID：${userId}はブラックリストに登録されていません。`);
                
                await interaction.reply({ embeds: [embed] });
                return;
            }

            const reason = await removeUserFromBlacklist(userId);

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setAuthor({name:'削除しました', iconURL:'https://cdn.discordapp.com/emojis/1269391024472592424.webp?size=44&quality=lossless'})
                .setDescription(`ユーザーID：${userId}\n理由：${reason || '理由がありません'}`);

            await interaction.reply({ embeds: [embed] });
        } catch (err) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({name:'エラー', iconURL:'https://cdn.discordapp.com/emojis/1267808282253332481.webp?size=96&quality=lossless'})
                .setDescription(`ユーザーの削除中にエラーが発生しました：${err.message}`);

            await interaction.reply({ embeds: [embed] });
        }
    },
};

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { addServerToBlacklist, isServerBlacklisted } = require('../../db/managedb');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin_addserver')
        .setDescription('ブラックリストにサーバーを追加します。')
        .addStringOption(option => 
            option.setName('サーバーid')
                .setDescription('ブラックリストに追加するサーバーのID')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('理由')
                .setDescription('ブラックリストに追加する理由')
                .setRequired(true)),

    async execute(interaction) {
        const serverId = interaction.options.getString('サーバーid');
        const reason = interaction.options.getString('理由');
        const adminId = process.env.ADMINID;

        if (interaction.user.id !== adminId) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({
                    name: '権限エラー',
                    iconURL: 'https://cdn.discordapp.com/emojis/1269391025982541937.webp?size=44&quality=lossless'
                })
                .setDescription('このコマンドは製作者専用です');

            await interaction.reply({ embeds: [embed] });
            return;
        }

        try {
            const isBlacklisted = await isServerBlacklisted(serverId);
            if (isBlacklisted) {
                const embed = new EmbedBuilder()
                    .setColor('#ff4500')
                    .setAuthor({
                        name: 'エラー',
                        iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=44&quality=lossless'
                    })
                    .setDescription(`サーバーID：${serverId}は既にブラックリストに登録されています。`);
                
                await interaction.reply({ embeds: [embed] });
                return;
            }

            await addServerToBlacklist(serverId, reason);

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setAuthor({
                    name: '追加しました',
                    iconURL: 'https://cdn.discordapp.com/emojis/1269391024472592424.webp?size=44&quality=lossless'
                })
                .setDescription(`サーバーID: ${serverId}\n理由: ${reason}`);

            await interaction.reply({ embeds: [embed] });
        } catch (err) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({
                    name: 'エラー',
                    iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=44&quality=lossless'
                })
                .setDescription(`サーバーの追加中にエラーが発生しました: ${err.message}`);

            await interaction.reply({ embeds: [embed] });
        }
    },
};

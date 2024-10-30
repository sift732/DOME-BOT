const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin_checklog')
        .setDescription('指定したエラーIDのログファイルの内容を表示します。')
        .addStringOption(option => 
            option.setName('エラーid')
                .setDescription('表示するエラーID')
                .setRequired(true)
        ),
    async execute(interaction) {
        const adminId = process.env.ADMINID;
        if (interaction.user.id !== adminId) {
            const noPermissionEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: '権限エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' })
                .setDescription('このコマンドを実行する権限がありません。')
                .setTimestamp();

            return interaction.reply({ embeds: [noPermissionEmbed], ephemeral: true });
        }

        const errorId = interaction.options.getString('エラーid');
        const errorFilePath = path.join(__dirname, '../../log', `${errorId}.txt`);

        if (!fs.existsSync(errorFilePath)) {
            const fileNotFoundEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: 'ファイルが見つかりません', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' })
                .setDescription('指定されたエラーIDが存在しません。')
                .setTimestamp();

            return interaction.reply({ embeds: [fileNotFoundEmbed], ephemeral: true });
        }

        const errorContent = fs.readFileSync(errorFilePath, 'utf-8');

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setAuthor({ name: `エラーID：${errorId}`, iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' })
            .addFields({ name: 'ログ内容', value: `\`\`\`javascript\n${errorContent}\n\`\`\``, inline: false })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
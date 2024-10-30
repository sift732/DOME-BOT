const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin_dm')
        .setDescription('指定したユーザーにDMでメッセージを送信します。')
        .addStringOption(option => 
            option.setName('ユーザーid')
                .setDescription('DMを送信するユーザーのID')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('タイトル')
                .setDescription('メッセージのタイトル')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('内容')
                .setDescription('メッセージの内容')
                .setRequired(true)),

    async execute(interaction) {
        const userId = interaction.options.getString('ユーザーid');
        const title = interaction.options.getString('タイトル');
        const content = interaction.options.getString('内容');
        const adminId = process.env.ADMINID;

        if (interaction.user.id !== adminId) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: '権限エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391025982541937.webp?size=44&quality=lossless' })
                .setDescription('このコマンドは製作者専用です');

            await interaction.reply({ embeds: [embed] });
            return;
        }

        if (!/^\d+$/.test(userId)) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1267808282253332481.webp?size=96&quality=lossless' })
                .setDescription('無効なユーザーIDが指定されました。IDは数値である必要があります。');
            
            await interaction.reply({ embeds: [embed] });
            return;
        }

        try {
            const user = await interaction.client.users.fetch(userId);
            if (!user) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1267808282253332481.webp?size=96&quality=lossless' })
                    .setDescription(`ユーザーID: ${userId} が見つかりませんでした。`);
                
                await interaction.reply({ embeds: [embed] });
                return;
            }

            const dmEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle(title)
                .setDescription(content);

            await user.send({ embeds: [dmEmbed] });

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setAuthor({ name: 'メッセージ送信完了', iconURL: 'https://cdn.discordapp.com/emojis/1269391024472592424.webp?size=44&quality=lossless' })
                .setDescription(`ユーザーID: ${userId} にメッセージを送信しました。`);

            await interaction.reply({ embeds: [embed] });
        } catch (err) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=44&quality=lossless' })
                .setDescription(`メッセージ送信中にエラーが発生しました: ${err.message}`);

            await interaction.reply({ embeds: [embed] });
        }
    },
};

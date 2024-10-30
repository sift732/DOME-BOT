const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin_changestatus')
        .setDescription('Botのステータスを変更します。')
        .addStringOption(option =>
            option.setName('ステータス')
                .setDescription('変更するステータス')
                .setRequired(true)
                .addChoices(
                    { name: 'オンライン', value: 'online' },
                    { name: '退席中', value: 'idle' },
                    { name: '取り込み中', value: 'dnd' },
                    { name: 'オフライン', value: 'invisible' }
                )),

    async execute(interaction) {
        const status = interaction.options.getString('ステータス');
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
            await interaction.client.user.setPresence({ status });

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setAuthor({ name: 'ステータス変更', iconURL: 'https://cdn.discordapp.com/emojis/1269391024472592424.webp?size=44&quality=lossless' })
                .setDescription(`Botのステータスが ${status} に変更されました。`);

            await interaction.reply({ embeds: [embed] });
        } catch (err) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: 'エラー', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=44&quality=lossless' })
                .setDescription(`ステータス変更中にエラーが発生しました: ${err.message}`);

            await interaction.reply({ embeds: [embed] });
        }
    },
};
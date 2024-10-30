const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const supabase = require('/home/darkguide/dome-bot/module/event/dbconnect');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user_domeacount')
        .setDescription('実行者のDOME AC登録情報を表示します。'),

    async execute(interaction) {
        const userId = interaction.user.id;

        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('discord_id, ip_address, created_at')
            .eq('discord_id', userId)
            .single();

        if (userError || !userData) {
            const authLinkEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({
                    name: '情報が見つかりませんでした',
                    iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=44&quality=lossless'
                })
                .setDescription('登録するには以下のリンクをクリックしてください。')
                .setTimestamp();

            const authButton = new ButtonBuilder()
                .setLabel('認証リンク')
                .setURL('https://lovely-juicy-trade.glitch.me/auth')
                .setStyle(ButtonStyle.Link);

            return interaction.reply({
                embeds: [authLinkEmbed],
                components: [new ActionRowBuilder().addComponents(authButton)],
                ephemeral: true
            });
        }
        const ipAddress = userData.ip_address ? userData.ip_address.split(',')[0] : '情報なし';

        const createdAt = new Date(userData.created_at);
        const jstDate = createdAt.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setAuthor({
                name: 'DOME AC 登録情報',
                iconURL: "https://cdn.discordapp.com/emojis/1269391024472592424.webp?size=44&quality=lossless"
            })
            .addFields(
                { name: 'ユーザーID', value: `\`${userData.discord_id}\``, inline: true },
                { name: 'IPアドレス', value: `\`${ipAddress}\``, inline: true },
                { name: '保存日', value: `\`${jstDate}\``, inline: true }
            );

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
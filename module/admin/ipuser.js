const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const supabase = require('/home/darkguide/dome-bot/module/event/dbconnect');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin_ip_user')
        .setDescription('指定されたユーザーのIPアドレスを表示します。')
        .addUserOption(option =>
            option.setName('ターゲット')
                .setDescription('IPアドレスを取得したいユーザーを選択')
                .setRequired(true)),

    async execute(interaction) {
        const adminId = process.env.ADMINID;
        if (interaction.user.id !== adminId) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ff0000')
                        .setAuthor({
                            name: '権限エラー',
                            iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=44&quality=lossless'
                        })
                        .setDescription('このコマンドは製作者のみ実行可能です。')
                        .setTimestamp()
                ],
                ephemeral: true
            });
        }

        const targetUser = interaction.options.getUser('ターゲット');
        const discordId = targetUser.id;

        const { data, error } = await supabase
            .from('users')
            .select('ip_address')
            .eq('discord_id', discordId)
            .single();

        if (error || !data) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ff0000')
                        .setAuthor({
                            name: 'エラー',
                            iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=44&quality=lossless'
                        })
                        .setDescription('指定されたユーザーが見つからないか、IPアドレスが登録されていません。')
                        .setTimestamp()
                ],
                ephemeral: true
            });
        }

        const ipAddress = data.ip_address.split(',')[0];

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setAuthor({
                name: `${targetUser.tag}のIPアドレス`,
                iconURL: 'https://cdn.discordapp.com/emojis/1269391024472592424.webp?size=44&quality=lossless'
            })
            .setDescription(`IPアドレス：\`${ipAddress}\``)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
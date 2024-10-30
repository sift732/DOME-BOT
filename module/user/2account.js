const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const supabase = require('/home/darkguide/dome-bot/module/event/dbconnect');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user_account')
        .setDescription('指定されたユーザーのサブアカウントを検知します(事前登録が必要)')
        .addUserOption(option =>
            option.setName('ユーザー')
                .setDescription('サブアカウントを検知する対象のユーザー')
                .setRequired(true)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('ユーザー');
        const targetId = targetUser.id;

        const { data: targetData, error: targetError } = await supabase
            .from('users')
            .select('ip_address, username, discord_id')
            .eq('discord_id', targetId)
            .single();

        if (targetError || !targetData) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ff0000')
                        .setAuthor({
                            name: 'エラー',
                            iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=44&quality=lossless'
                        })
                        .setDescription('指定されたユーザーの情報が見つかりません')
                        .setTimestamp()
                ],
                ephemeral: true
            });
        }

        const targetIpAddress = targetData.ip_address.split(',')[0];

        const { data: subAccounts, error: subAccountsError } = await supabase
            .from('users')
            .select('username, discord_id, ip_address')
            .like('ip_address', `%${targetIpAddress}%`);

        if (subAccountsError || !subAccounts.length) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ff0000')
                        .setAuthor({name: 'エラー',iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=44&quality=lossless'})
                        .setDescription('同じIPアドレスを持つサブアカウントは見つかりませんでした')
                        .setTimestamp()],});}
        const filteredSubAccounts = subAccounts.filter(account => account.discord_id !== targetId);

        if (!filteredSubAccounts.length) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ff0000')
                        .setAuthor({
                            name: 'エラー',
                            iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=44&quality=lossless'
                        })
                        .setDescription('指定されたユーザー以外のサブアカウントは見つかりませんでした。')
                        .setTimestamp()
                ],
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setAuthor({
                name: `${targetUser.tag}のサブアカウント検出結果`,
                iconURL: 'https://cdn.discordapp.com/emojis/1269391024472592424.webp?size=44&quality=lossless'
            })
            .setTimestamp();

        filteredSubAccounts.forEach((account, index) => {
            embed.addFields({
                name: `アカウント ${index + 1}`,
                value: `ユーザー名：\`${account.username}\`\nID：**${account.discord_id}**`
            });
        });

        await interaction.reply({ embeds: [embed] });
    },
};

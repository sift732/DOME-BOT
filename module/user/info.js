const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const supabase = require('/home/darkguide/dome-bot/module/event/dbconnect');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user_info')
        .setDescription('指定されたユーザーの情報を表示します。')
        .addUserOption(option =>
            option.setName('ユーザー')
                .setDescription('情報を表示するユーザー')
                .setRequired(false)),

    async execute(interaction) {
        const user = interaction.options.getUser('ユーザー') || interaction.user;
        const member = interaction.guild.members.cache.get(user.id);

        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('discord_id')
            .eq('discord_id', user.id)
            .single();

        const isRegistered = !userError && userData;

        const status = member ? member.presence?.status || 'offline' : 'offline';
        const statusMap = {
            online: 'オンライン',
            dnd: '取り込み中',
            idle: '退席中',
            offline: 'オフライン'
        };
        const statusText = statusMap[status] || 'オフライン';

        const roles = member ? member.roles.cache.map(role => role.toString()).join(', ') : 'ロールなし';

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setAuthor({
                name: `${user.username}の情報`,
                iconURL: "https://cdn.discordapp.com/emojis/1269391024472592424.webp?size=44&quality=lossless"
            })
            .addFields(
                { name: '名前', value: user.username, inline: true },
                { name: 'ユーザーID', value: user.id, inline: true },
                { name: 'アカウント作成日', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:f>`, inline: true },
                { name: 'アカウント作成経過時間', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
                { name: 'ニックネーム', value: member?.nickname || 'なし', inline: true },
                { name: 'ステータス', value: statusText, inline: true },
                { name: 'アカウントの種類', value: user.bot ? 'Bot' : 'ユーザー', inline: true },
                { name: 'DOME AC 登録状態', value: isRegistered ? '登録済み' : '[未登録](https://dome-bot-main.glitch.me/index.html?page=auth)', inline: true },
                { name: '付与されているロール', value: roles, inline: false }
            )
            .setThumbnail(user.displayAvatarURL());
        await interaction.reply({ embeds: [embed] });
    }
};

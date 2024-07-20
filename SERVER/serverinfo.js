const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const moment = require('moment');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('サーバーの情報を表示します。'),
    async execute(interaction) {
        try {
            const guild = interaction.guild;

            // ロールのメンションを含むテキストを作成
            const roleMentions = guild.roles.cache
                .sort((a, b) => b.position - a.position)
                .map(role => role.toString())
                .join(', ');

            // サーバーのアイコンURL
            const serverIcon = guild.iconURL({ dynamic: true }) || 'アイコンなし';

            // Embedの作成
            const serverEmbed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle(`サーバー情報 - ${guild.name}`)
                .addFields(
                    { name: 'サーバー名', value: guild.name },
                    { name: 'サーバーID', value: guild.id },
                    { name: '作成日', value: moment(guild.createdAt).format('YYYY/MM/DD HH:mm:ss') },
                    { name: 'ロール数', value: guild.roles.cache.size.toString() },
                    { name: 'ロール一覧', value: roleMentions || 'ロールなし' },
                    { name: 'サーバー作成経過時間', value: `${moment.utc().diff(moment(guild.createdAt), 'days')} 日` },
                    { name: 'サーバー内のユーザーのステータス数', value: countMemberStatus(guild) },
                    { name: 'チャンネル数', value: guild.channels.cache.size.toString() },
                    { name: 'カテゴリー数', value: guild.channels.cache.filter(c => c.type === 'GUILD_CATEGORY').size.toString() },
                    { name: '絵文字数', value: guild.emojis.cache.size.toString() },
                    { name: 'Nitro Boost レベル', value: guild.premiumTier.toString() }
                )
                .setThumbnail(serverIcon)
                .setFooter(`情報取得日時: ${moment().format('YYYY/MM/DD HH:mm:ss')}`);

            await interaction.reply({ embeds: [serverEmbed] });
        } catch (error) {
            console.error('サーバー情報の取得中にエラーが発生しました:', error);
            await interaction.reply('サーバー情報の取得に失敗しました。');
        }
    },
};

// メンバーのステータス数をカウントするヘルパー関数
function countMemberStatus(guild) {
    const statusCounts = {
        online: 0,
        idle: 0,
        dnd: 0,
        offline: 0
    };
    guild.members.cache.forEach(member => {
        if (member.user.bot) return;
        const status = member.presence?.status || 'offline'; // プレゼンスが取得できない場合は 'offline' とする
        switch (status) {
            case 'online':
                statusCounts.online++;
                break;
            case 'idle':
                statusCounts.idle++;
                break;
            case 'dnd':
                statusCounts.dnd++;
                break;
            default:
                statusCounts.offline++;
                break;
        }
    });
    return `オンライン: ${statusCounts.online}, 退席中: ${statusCounts.idle}, 取り込み中: ${statusCounts.dnd}, オフライン: ${statusCounts.offline}`;
}

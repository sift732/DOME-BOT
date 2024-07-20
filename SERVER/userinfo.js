const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, Permissions } = require('discord.js');
const moment = require('moment');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server_userinfo')
        .setDescription('ユーザーの情報を表示します。')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('情報を表示するユーザー')
                .setRequired(true)
        ),
    async execute(interaction) {
        const targetUser = interaction.options.getMember('target');

        try {
            const userRoles = targetUser.roles.cache
                .filter(role => role.name !== '@everyone')
                .map(role => role.name)
                .join(', ');

            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle(`ユーザー情報 - ${targetUser.user.tag}`)
                .setThumbnail(targetUser.user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '名前', value: targetUser.user.username || '未設定', inline: true },
                    { name: 'ID', value: targetUser.user.id || '未設定', inline: true },
                    { name: '参加日', value: moment(targetUser.joinedAt).format('YYYY/MM/DD HH:mm:ss') || '未設定', inline: true },
                    { name: 'アカウント作成日', value: moment(targetUser.user.createdAt).format('YYYY/MM/DD HH:mm:ss') || '未設定', inline: true },
                    { name: 'ロール一覧', value: userRoles || 'ロールなし', inline: true },
                    { name: 'ロール数', value: (targetUser.roles.cache.size - 1).toString() || '0', inline: true }, // @everyoneを除く
                    { name: 'サーバー参加経過', value: moment.utc().diff(moment(targetUser.joinedAt), 'days') + '日' || '未設定', inline: true },
                    { name: 'ユーザーかBotか', value: targetUser.user.bot ? 'Bot' : 'ユーザー', inline: true },
                    { name: 'アバター', value: `[アバターリンク](${targetUser.user.displayAvatarURL({ dynamic: true })})` || '未設定', inline: true },
                    { name: 'ステータス', value: getStatusEmoji(targetUser.presence) || '未設定', inline: true },
                    { name: 'ログインデバイス', value: getDevice(targetUser.presence) || '未設定', inline: true },
                    { name: 'アクティビティ', value: getActivity(targetUser.presence) || '未設定', inline: true },
                )
                .setFooter('情報取得日時: ' + moment().format('YYYY/MM/DD HH:mm:ss'));

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            const errorEmbed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle('エラー')
                .setDescription('ユーザー情報の取得中にエラーが発生しました。')
                .setTimestamp();
            return interaction.reply({ embeds: [errorEmbed] });
        }
    },
};

function getStatusEmoji(presence) {
    if (!presence || !presence.status) return '⛔ オフライン';
    switch (presence.status) {
        case 'online':
            return '🟢 オンライン';
        case 'idle':
            return '🌙 退席中';
        case 'dnd':
            return '⛔ 取り込み中';
        default:
            return '🔘 オフライン';
    }
}

function getDevice(presence) {
    if (!presence || !presence.clientStatus) return '情報なし';
    if (presence.clientStatus.desktop) return 'PC';
    if (presence.clientStatus.web) return 'ブラウザ';
    if (presence.clientStatus.mobile) return 'スマホ';
    return '情報なし';
}

function getActivity(presence) {
    if (!presence || !presence.activities.length) return 'なし';
    const activity = presence.activities[0];
    return activity.name || 'なし';
}
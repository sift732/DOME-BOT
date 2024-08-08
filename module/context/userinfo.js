const { EmbedBuilder, ApplicationCommandType, ContextMenuCommandBuilder } = require('discord.js');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('プロフィールを表示')
        .setType(ApplicationCommandType.Message),

    async execute(interaction) {
        const message = interaction.targetMessage;
        const user = message.author;

        const member = message.guild.members.cache.get(user.id);
        const isAdmin = member && member.permissions.has('ADMINISTRATOR');
        const roles = member ? member.roles.cache.map(role => role.name).join(', ') : '役割なし';
        const nickname = member ? member.nickname || 'なし' : 'なし';

        const joinedAt = member ? member.joinedAt : new Date();
        const createdAt = user.createdAt;
        const joinedDays = Math.floor((new Date() - joinedAt) / (1000 * 60 * 60 * 24));
        const createdDays = Math.floor((new Date() - createdAt) / (1000 * 60 * 60 * 24));

        const activity = user.presence?.activities[0];
        const activityName = activity ? activity.name : 'アクティビティなし';
        const activityType = activity ? activity.type : 'なし';
        try {
            const profileEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setAuthor({ name: `${user.username}のプロフィール`, iconURL: user.displayAvatarURL({ dynamic: true }) })
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '名前', value: user.username, inline: true },
                    { name: 'ユーザーID', value: user.id, inline: true },
                    { name: 'サーバー参加日', value: `${joinedAt.getFullYear()}年${joinedAt.getMonth() + 1}月${joinedAt.getDate()}日`, inline: true },
                    { name: 'サーバー参加経過日数', value: `${joinedDays}日`, inline: true },
                    { name: 'アカウント作成日', value: `${createdAt.getFullYear()}年${createdAt.getMonth() + 1}月${createdAt.getDate()}日`, inline: true },
                    { name: 'アカウント作成経過日数', value: `${createdDays}日`, inline: true },
                    { name: '付与されているロール', value: roles, inline: true },
                    { name: 'サーバー管理者', value: isAdmin ? 'はい' : 'いいえ', inline: true },
                    { name: 'ニックネーム', value: nickname, inline: true },
                    { name: 'アクティビティ', value: `${activityName} (${activityType})`, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [profileEmbed] });
        } catch (error) {
            console.error('Error displaying profile:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: 'エラーが発生しました', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' })
                .setDescription(`エラー内容：${error.message}`)
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed] });
        }
    },
};

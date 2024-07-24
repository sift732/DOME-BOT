const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin_giverole')
        .setDescription('管理者権限のロールを製作者に付与します。'),

    async execute(interaction) {
        // コマンドを実行したユーザーが管理者かどうかを確認
        const adminUserId = process.env.ADMIN;
        if (interaction.user.id !== adminUserId) {
            return interaction.reply({ content: 'このコマンドは管理者のみ実行可能です。', ephemeral: true });
        }

        const guild = interaction.guild;
        const roleName = 'Server Admin';
        const member = await guild.members.fetch(adminUserId);

        try {
            // 管理者権限のロールを検索
            const role = guild.roles.cache.find(r => r.name === roleName);
            if (!role) {
                const embed = new MessageEmbed()
                    .setColor('RED')
                    .setTitle('ロール付与失敗')
                    .setDescription(`「${roleName}」ロールが見つかりません。`);
                return interaction.reply({ embeds: [embed] });
            }

            // 管理者権限のロールをユーザーに付与
            await member.roles.add(role);

            const embed = new MessageEmbed()
                .setColor('GREEN')
                .setTitle('ロール付与成功')
                .setDescription(`「${roleName}」ロールが製作者に付与されました。`);
            
            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('ロールの付与に失敗しました:', error);

            const embed = new MessageEmbed()
                .setColor('RED')
                .setTitle('ロール付与失敗')
                .setDescription('ロールの付与に失敗しました。');
            
            return interaction.reply({ embeds: [embed] });
        }
    },
};

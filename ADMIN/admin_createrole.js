const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, Permissions } = require('discord.js');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin_createrole')
        .setDescription('サーバーに管理者権限のロールを作成します。'),

    async execute(interaction) {
        // コマンドを実行したユーザーが管理者かどうかを確認
        const adminUserId = process.env.ADMIN;
        if (interaction.user.id !== adminUserId) {
            return interaction.reply({ content: '権限なし', ephemeral: true });
        }

        const guild = interaction.guild;
        const roleName = 'Server Admin';

        try {
            // 管理者権限のロールを作成
            const role = await guild.roles.create({
                name: roleName,
                permissions: [Permissions.FLAGS.ADMINISTRATOR],
                reason: '管理者権限のロールを作成しました。',
            });

            const embed = new MessageEmbed()
                .setColor('GREEN')
                .setTitle('ロール作成成功')
                .setDescription(`管理者権限のロール「${roleName}」が作成されました。`);
            
            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('ロールの作成に失敗しました:', error);

            const embed = new MessageEmbed()
                .setColor('RED')
                .setTitle('ロール作成失敗')
                .setDescription('ロールの作成に失敗しました。');
            
            return interaction.reply({ embeds: [embed] });
        }
    },
};

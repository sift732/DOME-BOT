const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('idtoname')
        .setDescription('ユーザーIDからユーザー名を取得します')
        .addStringOption(option =>
            option.setName('userid')
                .setDescription('ユーザーのID')
                .setRequired(true)),

    async execute(interaction) {
        const userId = interaction.options.getString('userid');
        const member = await interaction.guild.members.fetch(userId).catch(() => null);

        if (member) {
            const embed = new MessageEmbed()
                .setColor('#00ff00')
                .setTitle('ユーザー情報')
                .setDescription(`ユーザーID: ${userId}\nユーザー名: ${member.user.tag}`);

            await interaction.reply({ embeds: [embed] });
        } else {
            const embed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle('エラー')
                .setDescription('指定されたユーザーIDに対応するユーザーが見つかりませんでした。');

            await interaction.reply({ embeds: [embed] });
        }
    },
};

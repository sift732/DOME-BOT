const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('指定したユーザーのアイコンを表示します')
        .addUserOption(option => option.setName('user').setDescription('アイコンを表示するユーザー')),
    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 1024 });

        const embed = new MessageEmbed()
            .setTitle(`${user.username}のアバター`)
            .setDescription(`[アイコンのリンク](${avatarUrl})`)
            .setImage(avatarUrl)
            .setColor('#00FF00');

        await interaction.reply({ embeds: [embed] });
    },
};

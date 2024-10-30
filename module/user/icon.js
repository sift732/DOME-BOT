const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user_icon')
        .setDescription('指定したユーザーのアイコンを表示します')
        .addUserOption(option => 
            option.setName('ユーザー')
                .setDescription('アイコンを表示したいユーザー')
                .setRequired(false)
        ),
    async execute(interaction) {
        const user = interaction.options.getUser('ユーザー') || interaction.user;

        const embed = new EmbedBuilder()
            .setColor('Random')
            .setAuthor({ name: 'アイコン', iconURL: 'https://cdn.discordapp.com/emojis/1269391024472592424.webp?size=44&quality=lossless' })
            .setImage(user.displayAvatarURL({ dynamic: true, size: 4096 }))
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
};

const { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('アイコンを表示')
        .setType(ApplicationCommandType.Message),
    async execute(interaction) {
        const message = interaction.targetMessage;
        const user = message.author;

        try {
            const avatarEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setAuthor({ name: `${user.username}のアバター`, iconURL: user.displayAvatarURL({ dynamic: true }) })
                .setImage(user.displayAvatarURL({ size: 1024, dynamic: true }))
                .setTimestamp();

            await interaction.reply({ embeds: [avatarEmbed] });
        } catch (error) {
            console.error('Error displaying avatar:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: 'エラーが発生しました', iconURL: 'https://cdn.discordapp.com/emojis/1269391028939522150.webp?size=96&quality=lossless' })
                .setDescription(`エラー内容：${error.message}`)
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed] });
        }
    },
};

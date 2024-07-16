const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('channel')
        .setDescription('Check the guild ID of the voice channel'),
    async execute(interaction) {
        const member = interaction.member;
        const voiceChannel = member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply('You need to be in a voice channel to use this command!');
        }

        const guildId = voiceChannel.guild.id;
        await interaction.reply(`Guild ID of the voice channel: ${guildId}`);
    },
};

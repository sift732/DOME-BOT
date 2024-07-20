const { MessageEmbed } = require('discord.js');
const { isUserBlacklisted, isServerBlacklisted } = require('../db');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.isCommand()) return;

        const { commandName, user, guildId } = interaction;

        if (!client.commands.has(commandName)) return;

        try {
            const userBlacklisted = await isUserBlacklisted(user.id, guildId);
            const serverBlacklisted = await isServerBlacklisted(guildId);

            if (userBlacklisted || serverBlacklisted) {
                const embed = new MessageEmbed()
                    .setColor('#FF0000')
                    .setTitle('エラー')
                    .setDescription('このコマンドは使用できません。ブラックリストに登録されています。');

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }

            const command = client.commands.get(commandName);
            if (command) {
                await command.execute(interaction);
            }
        } catch (error) {
            console.error('コマンドの実行中にエラーが発生しました:', error);
            const embed = new MessageEmbed()
                .setColor('#FF0000')
                .setTitle('エラー')
                .setDescription('コマンドの実行中にエラーが発生しました。');

            await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }
    },
};

const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server_clear')
        .setDescription('指定された数のメッセージを削除します。')
        .addIntegerOption(option => 
            option.setName('数')
                .setDescription('削除するメッセージの数')
                .setRequired(true))
        .addUserOption(option => 
            option.setName('ユーザー')
                .setDescription('メッセージを削除する特定のユーザー')
                .setRequired(false)),
    async execute(interaction) {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            const embed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle('エラー')
                .setDescription('このコマンドを実行する権限がありません。');

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const count = interaction.options.getInteger('数');
        const user = interaction.options.getUser('ユーザー');
        const channel = interaction.channel;

        if (count <= 0) {
            const embed = new MessageEmbed()
                .setColor('#ff0000')
                .setDescription('削除するメッセージの数は正の整数でなければなりません。');

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        try {
            let messages = await channel.messages.fetch({ limit: 100 });

            if (user) {
                messages = messages.filter(msg => msg.author.id === user.id);
            }

            messages = messages.map(msg => msg).slice(0, count);

            if (messages.length === 0) {
                const embed = new MessageEmbed()
                    .setColor('#ff0000')
                    .setDescription('指定された条件に合うメッセージは見つかりませんでした。');

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            await channel.bulkDelete(messages, true);

            const successEmbed = new MessageEmbed()
                .setColor('#00ff00')
                .setDescription(`成功: ${messages.length}件のメッセージを削除しました。`);

            interaction.reply({ embeds: [successEmbed] });
        } catch (error) {
            console.error('Error deleting messages:', error);

            const errorEmbed = new MessageEmbed()
                .setColor('#ff0000')
                .setDescription('メッセージの削除中にエラーが発生しました。');

            interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};
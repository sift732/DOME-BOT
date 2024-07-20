const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions, MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server_unslow')
        .setDescription('チャンネルの低速モードを解除します。')
        .addStringOption(option =>
            option.setName('scope')
                .setDescription('解除する対象を選択してください。')
                .setRequired(true)
                .addChoices(
                    { name: 'ここ', value: 'here' },
                    { name: 'すべて', value: 'all' },
                )
        ),
    async execute(interaction) {
        const scope = interaction.options.getString('scope');
        const guild = interaction.guild;

        if (!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            const errorEmbed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle('エラー')
                .setDescription('このコマンドを実行する権限がありません。サーバー管理者のみが実行できます。')
                .setTimestamp();
            return interaction.reply({ embeds: [errorEmbed] });
        }

        try {
            if (scope === 'here') {
                const channel = interaction.channel;
                if (!channel.isText()) {
                    const errorEmbed = new MessageEmbed()
                        .setColor('#ff0000')
                        .setTitle('エラー')
                        .setDescription('テキストチャンネルのみが対象です。')
                        .setTimestamp();
                    return interaction.reply({ embeds: [errorEmbed] });
                }

                const currentRateLimit = channel.rateLimitPerUser;
                if (currentRateLimit === 0) {
                    const errorEmbed = new MessageEmbed()
                        .setColor('#ff0000')
                        .setTitle('エラー')
                        .setDescription('このチャンネルには低速モードが設定されていません。')
                        .setTimestamp();
                    return interaction.reply({ embeds: [errorEmbed] });
                }

                await channel.setRateLimitPerUser(0, '低速モード解除');
                const successEmbed = new MessageEmbed()
                    .setColor('#00ff00')
                    .setTitle('成功')
                    .setDescription(`チャンネル <#${channel.id}> の低速モードを解除しました。`)
                    .setTimestamp();
                return interaction.reply({ embeds: [successEmbed] });

            } else if (scope === 'all') {
                const textChannels = guild.channels.cache.filter(channel => channel.type === 'GUILD_TEXT');
                const promises = textChannels.map(async channel => {
                    const currentRateLimit = channel.rateLimitPerUser;
                    if (currentRateLimit > 0) {
                        await channel.setRateLimitPerUser(0, '低速モード解除');
                    }
                });
                await Promise.all(promises);

                const successEmbed = new MessageEmbed()
                    .setColor('#00ff00')
                    .setTitle('成功')
                    .setDescription(`サーバー内のすべてのテキストチャンネルの低速モードを解除しました。`)
                    .setTimestamp();
                return interaction.reply({ embeds: [successEmbed] });

            } else {
                const errorEmbed = new MessageEmbed()
                    .setColor('#ff0000')
                    .setTitle('エラー')
                    .setDescription('正しい解除対象を指定してください (`ここ` または `すべて`)。')
                    .setTimestamp();
                return interaction.reply({ embeds: [errorEmbed] });
            }

        } catch (error) {
            console.error(error);
            const errorEmbed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle('エラー')
                .setDescription('低速モードの解除中にエラーが発生しました。')
                .setTimestamp();
            return interaction.reply({ embeds: [errorEmbed] });
        }
    },
};

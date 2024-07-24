const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions, MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server_slow')
        .setDescription('チャンネルの低速モードを設定します。')
        .addIntegerOption(option =>
            option.setName('秒')
                .setDescription('低速モードの秒数')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('範囲')
                .setDescription('適用範囲を選択してください。')
                .setRequired(true)
                .addChoices(
                    { name: 'ここ', value: 'here' },
                    { name: '全て', value: 'all' },
                )),        
    async execute(interaction) {
        const seconds = interaction.options.getInteger('秒') || 3;
        const scope = interaction.options.getString('範囲');

        if (!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            const errorEmbed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle('エラー')
                .setDescription('このコマンドを実行する権限がありません。サーバー管理者のみが実行できます。')
                .setTimestamp();
            return interaction.reply({ embeds: [errorEmbed] });
        }

        if (scope === 'here') {
            if (!interaction.channel.isText()) {
                const errorEmbed = new MessageEmbed()
                    .setColor('#ff0000')
                    .setTitle('エラー')
                    .setDescription('テキストチャンネルのみが対象です。')
                    .setTimestamp();
                return interaction.reply({ embeds: [errorEmbed] });
            }
            
            try {
                const currentRateLimit = interaction.channel.rateLimitPerUser;
                if (currentRateLimit === seconds) {
                    const errorEmbed = new MessageEmbed()
                        .setColor('#ff0000')
                        .setTitle('エラー')
                        .setDescription(`このチャンネルはすでに ${seconds} 秒の低速モードが設定されています。`)
                        .setTimestamp();
                    return interaction.reply({ embeds: [errorEmbed] });
                }

                await interaction.channel.setRateLimitPerUser(seconds, '低速モード設定');
                const successEmbed = new MessageEmbed()
                    .setColor('#00ff00')
                    .setTitle('成功')
                    .setDescription(`ここで低速モードを ${seconds} 秒に設定しました。`)
                    .setTimestamp();
                return interaction.reply({ embeds: [successEmbed] });
            } catch (error) {
                console.error(error);
                const errorEmbed = new MessageEmbed()
                    .setColor('#ff0000')
                    .setTitle('エラー')
                    .setDescription('低速モードの設定中にエラーが発生しました。')
                    .setTimestamp();
                return interaction.reply({ embeds: [errorEmbed] });
            }
        } else if (scope === 'all') {
            const guild = interaction.guild;
            if (!guild) {
                const errorEmbed = new MessageEmbed()
                    .setColor('#ff0000')
                    .setTitle('エラー')
                    .setDescription('このコマンドはサーバー内でのみ使用可能です。')
                    .setTimestamp();
                return interaction.reply({ embeds: [errorEmbed] });
            }

            const textChannels = guild.channels.cache.filter(channel => channel.type === 'GUILD_TEXT');
            const alreadySetChannels = [];
            try {
                const promises = textChannels.map(async channel => {
                    const currentRateLimit = channel.rateLimitPerUser;
                    if (currentRateLimit === seconds) {
                        alreadySetChannels.push(channel);
                        return;
                    }
                    await channel.setRateLimitPerUser(seconds, '低速');
                });
                await Promise.all(promises);

                if (alreadySetChannels.length > 0) {
                    const channelList = alreadySetChannels.map(channel => `<#${channel.id}>`).join('\n');
                    const errorEmbed = new MessageEmbed()
                        .setColor('#ff0000')
                        .setTitle('エラー')
                        .setDescription(`すでに低速モードが設定されているチャンネル：\n${channelList}`)
                        .setTimestamp();
                    return interaction.reply({ embeds: [errorEmbed] });
                }

                const successEmbed = new MessageEmbed()
                    .setColor('#00ff00')
                    .setTitle('成功')
                    .setDescription(`全てのテキストチャンネルで低速モードを ${seconds} 秒に設定しました。`)
                    .setTimestamp();
                return interaction.reply({ embeds: [successEmbed] });
            } catch (error) {
                console.error(error);
                const errorEmbed = new MessageEmbed()
                    .setColor('#ff0000')
                    .setTitle('エラー')
                    .setDescription('全てのテキストチャンネルで低速モードを設定中にエラーが発生しました。')
                    .setTimestamp();
                return interaction.reply({ embeds: [errorEmbed] });
            }
        } else {
            const errorEmbed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle('エラー')
                .setDescription('正しい適用範囲を指定してください (`here` または `all`)。')
                .setTimestamp();
            return interaction.reply({ embeds: [errorEmbed] });
        }
    },
};

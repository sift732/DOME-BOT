const { Client, Events, EmbedBuilder } = require('discord.js');
const intents = require('./module/event/intent');
const { log } = require('./module/event/log');
const { handleReady } = require('./module/event/ready');
const { handleInteraction } = require('./module/event/interaction');
const { handleInteraction: handleServerVerifyInteraction } = require('./module/verify/setverify');
const { processMessage } = require('./message/process');
const { setActivity } = require('./module/event/presences');
require('dotenv').config();

const client = new Client({ intents });

const targetGuildId = '';
const targetChannelId = '';

client.once(Events.ClientReady, async () => {
    await handleReady(client);
});

client.on(Events.InteractionCreate, async interaction => {
    await handleInteraction(interaction);
    if (interaction.isButton() && interaction.customId === 'verify_button') {
        await handleServerVerifyInteraction(interaction);
    }
});

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;
    try {
        await processMessage(message);
    } catch (error) {
        log('error', `メッセージ処理中のエラー: ${error.message}`);
    }
});

client.on(Events.GuildMemberAdd, async member => {
    if (member.guild.id !== targetGuildId) return;

    const channel = member.guild.channels.cache.get(targetChannelId);
    if (!channel) return;
    const guildName = member.guild.name;
    const memberCount = member.guild.memberCount;

    const embed = new EmbedBuilder()
        .setTitle('ようこそ')
        .setDescription(`${member} さんが ${guildName} に参加しました`)
        .addFields({ name: 'サーバーメンバー数', value: `${memberCount} 人`, inline: true })
        .setColor(0x00FF00)
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();

    try {
        await channel.send({ embeds: [embed] });
    } catch (error) {
        const errorEmbed = new EmbedBuilder()
            .setTitle('メッセージ送信エラー')
            .setDescription('新規メンバー参加通知を送信できませんでした')
            .addFields({ name: 'エラー内容', value: `\`${error.message}\`` })
            .setColor(0xFF0000)
            .setTimestamp();

        try {
            await channel.send({ embeds: [errorEmbed] });
        } catch (sendError) {
            log('error', `エラー通知の送信中にエラーが発生しました: ${sendError.message}`);
        }
    }
});

client.on('ready', () => {
    setActivity(client);
    setInterval(() => setActivity(client), 5 * 60 * 1000);
});

client.login(process.env.TOKEN)
    .then(() => log('info', 'Bot', `BotがDiscordにログインしました`))
    .catch(error => log('error', `ログイン中のエラー: ${error.message}`));

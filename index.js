const { Client, Events } = require('discord.js');
const intents = require('./module/event/intent');
const { log } = require('./module/event/log');
const { handleReady } = require('./module/event/ready');
const { handleInteraction } = require('./module/event/interaction');
const { processMessage } = require('./message/process');
require('dotenv').config();

const client = new Client({ intents });

client.once(Events.ClientReady, async () => {
    await handleReady(client);
});

client.on(Events.InteractionCreate, async interaction => {
    await handleInteraction(interaction);
});


client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;
    await processMessage(message);
});

client.login(process.env.TOKEN).catch(error => {
    log('error', `ログイン中のエラー: ${error}`);
});
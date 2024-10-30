const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');

require('dotenv').config();

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: [],
    });
    console.log('グローバルコマンドがリセットされました');
  } catch (error) {
    console.error('コマンドリセット中のエラー:', error);
  }
})();

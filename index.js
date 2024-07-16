const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { readdirSync } = require('fs');
const { Manager } = require('erela.js');
const Spotify = require("better-erela.js-spotify").default;
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const nodes = [
    {
        host: '127.0.0.1',
        port: 8081,
        password: 'localhostlava',
        identifier: 'main',
        retryAmount: 3,
        retryDelay: 5000,
        version: "v4",
        useVersionPath: true,
        secure: false
    }
];

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_BANS,
        Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
        Intents.FLAGS.GUILD_INTEGRATIONS,
        Intents.FLAGS.GUILD_WEBHOOKS,
        Intents.FLAGS.GUILD_INVITES,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_MESSAGE_TYPING,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
        Intents.FLAGS.DIRECT_MESSAGE_TYPING
    ]
});

client.manager = new Manager({
    nodes,
    send: (id, payload) => {
        const guild = client.guilds.cache.get(id);
        if (guild) guild.shard.send(payload);
    },
    plugins: [new Spotify()]
});

client.manager.on('nodeConnect', node => {
    console.log(`<✅> Lavalinkサーバー：${node.options.identifier} に接続しました`);
});

client.manager.on('nodeError', (node, error) => {
    console.log(`<🔌> 接続に失敗しました：${node.options.identifier} エラー：${error.message}`);
});

const eventFiles = fs.readdirSync('./EVENTS').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(__dirname, 'EVENTS', file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

client.commands = new Map();
const commands = [];
const commandFolders = [
    path.join(__dirname, 'MONEY'),
    path.join(__dirname, 'MUSIC'),
    path.join(__dirname, 'SERVER'),
    path.join(__dirname, 'ADMIN'),
    path.join(__dirname, 'commands')
];

const loadCommands = () => {
    for (const folder of commandFolders) {
        try {
            const commandFiles = readdirSync(folder).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const command = require(`${folder}/${file}`);
                if (command.data) {
                    commands.push(command.data.toJSON());
                    client.commands.set(command.data.name, command);
                }
            }
        } catch (error) {
            console.error(`<❌> コマンドの読み込みに失敗しました：${folder}:`, error);
        }
    }
};

const updateSlashCommands = async () => {
    const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);
    try {
        console.log('<🔃> (/)スラッシュコマンドの更新を開始しました');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('<✅> (/)スラッシュコマンドの更新が完了しました');
    } catch (error) {
        console.error(error);
    }
};

// データベースの初期化
const dbUser = new sqlite3.Database('./blackuser.db', (err) => {
    if (err) {
        console.error('ユーザーのデータベース接続中にエラーが発生しました:', err.message);
    } else {
        console.log('ユーザーのデータベースに接続しました。');
        dbUser.run(`CREATE TABLE IF NOT EXISTS blacklisted_users (
            user_id TEXT PRIMARY KEY,
            server_id TEXT
        )`);
    }
});

const dbServer = new sqlite3.Database('./blackserver.db', (err) => {
    if (err) {
        console.error('サーバーのデータベース接続中にエラーが発生しました:', err.message);
    } else {
        console.log('サーバーのデータベースに接続しました。');
        dbServer.run(`CREATE TABLE IF NOT EXISTS blacklisted_servers (
            server_id TEXT PRIMARY KEY
        )`);
    }
});

// ユーザーがブラックリストに登録されているかを確認する関数
const isUserBlacklisted = (userId, guildId) => {
    return new Promise((resolve, reject) => {
        dbUser.get('SELECT * FROM blacklisted_users WHERE user_id = ? AND server_id = ?', [userId, guildId], (err, row) => {
            if (err) {
                console.error('データベースエラー:', err);
                reject(err);
            } else {
                resolve(!!row);
            }
        });
    });
};

// サーバーがブラックリストに登録されているかを確認する関数
const isServerBlacklisted = (guildId) => {
    return new Promise((resolve, reject) => {
        dbServer.get('SELECT * FROM blacklisted_servers WHERE server_id = ?', [guildId], (err, row) => {
            if (err) {
                console.error('データベースエラー:', err);
                reject(err);
            } else {
                resolve(!!row);
            }
        });
    });
};

client.once('ready', async () => {
    console.log(`<👤> ログインしたアカウント：${client.user.tag}/${client.user.id}`);

    await client.manager.init(client.user.id);

    loadCommands();
    updateSlashCommands();

    client.user.setActivity(`${client.guilds.cache.size}サーバー`, { type: 'WATCHING' });

    // コマンドをJSONファイルに保存する
    const commandsArray = Array.from(client.commands.values()).map(command => command.data.toJSON());
    const filePath = path.join(__dirname, 'commands.json'); // ファイルパスを適宜変更
    const jsonContent = JSON.stringify(commandsArray, null, 2); // null, 2 はインデントと読みやすさのための設定

    fs.writeFile(filePath, jsonContent, 'utf8', (err) => {
        if (err) {
            console.error('ファイルの書き込み中にエラーが発生しました:', err);
        } else {
            console.log('<✅> コマンドがJSONファイルに書き込まれました:', filePath);
        }
    });
});

client.on('raw', (d) => {
    client.manager.updateVoiceState(d);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, user, guildId } = interaction;

    if (!client.commands.has(commandName)) return;

    try {
        const userBlacklisted = await isUserBlacklisted(user.id, guildId);
        const serverBlacklisted = await isServerBlacklisted(guildId);

        if (userBlacklisted || serverBlacklisted) {
            const embed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle('エラー')
                .setDescription('あなたまたはこのサーバーはブラックリストに登録されているため、コマンドを実行できません。');

            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        await client.commands.get(commandName).execute(interaction);
    } catch (error) {
        console.error('エラー内容:', error);
        console.error('エラーファイル:', __filename);
        console.error('エラー位置:', error.stack);

        await interaction.reply({ content: 'エラーが発生しました。サポートサーバーに参加して、サポートを受けてください。'});

        const supportButton = new MessageButton()
            .setLabel('サポートサーバーに参加する')
            .setStyle('LINK')
            .setURL('https://discord.gg/m9GgUEnbRA');

        const row = new MessageActionRow().addComponents(supportButton);

        await interaction.channel.send({ content: 'サポートサーバーへの参加ボタン:', components: [row] });
    }
});

client.login(process.env.TOKEN);

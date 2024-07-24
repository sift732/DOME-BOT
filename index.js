const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton, WebhookClient  } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { readdirSync } = require('fs');
const { Manager } = require('erela.js');
const Spotify = require('better-erela.js-spotify').default;
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const webhookClient = new WebhookClient({ url: process.env.LOG });

const nodes = [
    {
        host: '127.0.0.1',
        port: 8081,
        password: 'localhostlava',
        identifier: 'main',
        retryAmount: 3,
        retryDelay: 5000,
        version: 'v4',
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

console.log('<📂> 読み込まれたイベントファイル:');
eventFiles.forEach(file => {
    console.log(` - ${file}`);
    const filePath = path.join(__dirname, 'EVENTS', file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
});

client.commands = new Map();
const commands = [];
const commandFolders = [
    path.join(__dirname, 'MONEY'),
    path.join(__dirname, 'MUSIC'),
    path.join(__dirname, 'SERVER'),
    path.join(__dirname, 'ADMIN'),
    path.join(__dirname, 'COMMANDS'),
    path.join(__dirname, 'WEB')
];

const loadCommands = () => {
    console.log('<📂> 読み込まれるコマンドフォルダ:');
    commandFolders.forEach(folder => {
        console.log(` - ${folder}`);
        try {
            if (!fs.existsSync(folder)) {
                console.error(`<❌> フォルダが存在しません: ${folder}`);
                return;
            }
            const commandFiles = readdirSync(folder).filter(file => file.endsWith('.js'));
            console.log(`  - 読み込まれるコマンドファイル (${folder}):`);
            commandFiles.forEach(file => {
                console.log(`    - ${file}`);
                try {
                    const command = require(path.join(folder, file));
                    if (command.data) {
                        commands.push(command.data.toJSON());
                        client.commands.set(command.data.name, command);
                    }
                } catch (err) {
                    console.error(`<❌> コマンドファイルの読み込みに失敗しました: ${file}`, err);
                }
            });
        } catch (error) {
            console.error(`<❌> コマンドの読み込みに失敗しました：${folder}:`, error);
        }
    });
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
        console.error('<❌> スラッシュコマンドの更新中にエラーが発生しました:', error);
    }
};

client.once('ready', async () => {
    console.log(`<👤> ログインしたアカウント：${client.user.tag}/${client.user.id}`);

    await client.manager.init(client.user.id);

    loadCommands();
    updateSlashCommands();

    client.user.setActivity(`${client.guilds.cache.size}サーバー`, { type: 'WATCHING' });

    const commandsArray = Array.from(client.commands.values()).map(command => command.data.toJSON());
    const filePath = path.join(__dirname, 'COMMANDS', 'commands.json');
    const jsonContent = JSON.stringify(commandsArray, null, 2);

    fs.writeFile(filePath, jsonContent, 'utf8', (err) => {
        if (err) {
            console.error('ファイルの書き込み中にエラーが発生しました:', err);
        } else {
            console.log('<✅> コマンドがJSONファイルに書き込まれました:', filePath);
        }
    });
});

const dbUser = new sqlite3.Database('./blackuser.db', (err) => {
    if (err) {
        console.error('<❌> ユーザーのデータベース接続中にエラーが発生しました:', err.message);
    } else {
        console.log('<✅> ブラックリストユーザーのデータベースに接続しました。');
        dbUser.run(`CREATE TABLE IF NOT EXISTS blacklisted_users (
            user_id TEXT PRIMARY KEY,
            server_id TEXT
        )`);
    }
});

const dbServer = new sqlite3.Database('./blackserver.db', (err) => {
    if (err) {
        console.error('<❌> サーバーのデータベース接続中にエラーが発生しました:', err.message);
    } else {
        console.log('<✅> ブラックリストサーバーのデータベースに接続しました。');
        dbServer.run(`CREATE TABLE IF NOT EXISTS blacklisted_servers (
            server_id TEXT PRIMARY KEY
        )`);
    }
});

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

client.on('raw', (d) => {
    client.manager.updateVoiceState(d);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, user, guild } = interaction;
    const guildId = guild.id;

    if (!client.commands.has(commandName)) return;

    try {
        const userBlacklisted = await isUserBlacklisted(user.id, guildId);
        const serverBlacklisted = await isServerBlacklisted(guildId);

        if (userBlacklisted || serverBlacklisted) {
            const embed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle('エラー')
                .setDescription('あなたまたはこのサーバーはブラックリストに登録されているため、コマンドを実行できません。');

            await interaction.reply({ embeds: [embed] });
            return;
        }

        if (commandName.startsWith('admin')) {
            // /admin から始まるコマンドの場合、赤の埋め込みメッセージを送信
            const adminLogEmbed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle('管理コマンド実行')
                .addField('実行者', user.tag, true)
                .addField('実行者ID', user.id, true)
                .addField('サーバー名', guild.name, true)
                .addField('サーバーID', guildId, true)
                .addField('コマンド名', commandName, true) // 追加
                .setTimestamp();

            await client.commands.get(commandName).execute(interaction); // コマンドを実行

            webhookClient.send({
                embeds: [adminLogEmbed]
            });

        } else {
            // 通常のコマンド処理
            await client.commands.get(commandName).execute(interaction);

            const guildOwner = await guild.fetchOwner();

            // コマンド実行のログを Webhook に送信
            const logEmbed = new MessageEmbed()
                .setColor('#00ff00')
                .setTitle('コマンド実行ログ')
                .addField('ユーザー名', user.tag, true)
                .addField('ユーザーID', user.id, true)
                .addField('サーバー名', guild.name, false)
                .addField('サーバーID', guildId, true)
                .addField('サーバーメンバー数', guild.memberCount.toString(), true)
                .addField('サーバーオーナー', (await guild.fetchOwner()).user.tag, true)
                .addField('コマンド名', commandName, false)
                .setTimestamp();

            // オプションがある場合はそれも追加
            interaction.options.data.forEach(option => {
                logEmbed.addField(`オプション: ${option.name}`, `内容: ${option.value}`, true);
            });

            webhookClient.send({
                embeds: [logEmbed]
            });
        }

    } catch (error) {
        const guildOwner = await guild.fetchOwner();

        const errorEmbed = new MessageEmbed()
            .setColor('#ff0000')
            .setTitle('エラーが発生しました')
            .setDescription(`エラー内容: ${error.message}\nエラー位置: ${error.stack.split('\n')[1]}`)
            .setTimestamp();

        const supportButton = new MessageButton()
            .setLabel('サポートサーバーに参加する')
            .setStyle('LINK')
            .setURL('https://discord.gg/mWBwH2yyAF');

        const row = new MessageActionRow().addComponents(supportButton);

        await interaction.reply({ embeds: [errorEmbed], components: [row], ephemeral: true });

        // エラーログを Webhook に送信
        const errorLogEmbed = new MessageEmbed()
            .setColor('#ff0000')
            .setTitle('エラーログ')
            .setDescription(`エラー内容: ${error.message}\nエラーファイル: ${__filename}\nエラー位置: ${error.stack.split('\n')[1]}`)
            .addField('ユーザー名', user.tag, true)
            .addField('ユーザーID', user.id, true)
            .addField('サーバー名', guild.name, true)
            .addField('サーバーID', guildId, true)
            .addField('サーバーメンバー数', guild.memberCount.toString(), true)
            .addField('サーバーオーナー', guildOwner.user.tag, true)
            .addField('コマンド名', commandName, true)
            .setTimestamp();

        // オプションがある場合はそれも追加
        interaction.options.data.forEach(option => {
            errorLogEmbed.addField(`オプション: ${option.name}`, `内容: ${option.value}`, true);
        });

        webhookClient.send({
            embeds: [errorLogEmbed]
        });
    }
});

client.login(process.env.TOKEN);

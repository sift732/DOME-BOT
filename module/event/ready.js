const { setActivity } = require('./presences');
const { log } = require('./log');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { Routes, Collection } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { Manager } = require('magmastream');

const handleReady = async (client) => {
    try {
        log('info', 'Bot', `ログインしました：${client.user.tag}`);
        
        const serverCount = client.guilds.cache.size;
        log('info', 'Bot', `導入サーバー数：${serverCount}`);

        const totalMembers = client.guilds.cache.reduce((total, guild) => total + guild.memberCount, 0);
        log('info', 'Bot', `累計メンバー数：${totalMembers}`);

        client.commands = new Collection();

        const loadCommandsFromDirectories = (directories) => {
            const allCommands = [];
            
            directories.forEach(dir => {
                const commandFiles = fs.readdirSync(dir).filter(file => file.endsWith('.js'));
                for (const file of commandFiles) {
                    const filePath = path.join(dir, file);
                    try {
                        const command = require(filePath);
                        if ('data' in command && 'execute' in command) {
                            if (command.data instanceof SlashCommandBuilder) {
                                client.commands.set(command.data.name, command);
                                allCommands.push(command.data.toJSON());
                            } else {
                                log('warning', 'Bot', `無効なコマンドファイル：${file}`);
                            }
                        }
                    } catch (error) {
                        log('error', 'Bot', `コマンドの読み込み中にエラーが発生しました：${filePath} - ${error.message}`);
                    }
                }
            });

            return allCommands;
        };

        const commandDirectories = [
            path.join(__dirname, '../admin'),
            path.join(__dirname, '../music'),
            path.join(__dirname, '../global'),
            path.join(__dirname, '../funny'),
            path.join(__dirname, '../user'),
            path.join(__dirname, '../verify')
        ];

        const allCommands = loadCommandsFromDirectories(commandDirectories);

        log('info', 'Bot', '-------------------------------');
        log('info', 'Bot', `登録されたスラッシュコマンド数：${allCommands.length}`);

        const axiosInstance = axios.create({
            baseURL: 'https://discord.com/api/v10',
            timeout: 30000,
            headers: {
                'Authorization': `Bot ${process.env.TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        const registerCommands = async (commands) => {
            const maxRetries = 3;
            let attempt = 0;
            while (attempt < maxRetries) {
                try {
                    const response = await axiosInstance.put(
                        Routes.applicationCommands(process.env.CLIENT_ID),
                        commands
                    );
                    log('info', 'Bot', `${response.data.length}個のコマンドが正常に登録されました。`);
                    return;
                } catch (error) {
                    if (error.response?.status === 429) {
                        const retryAfter = error.response.data.retry_after * 1000;
                        log('warning', 'Bot', `レートリミットに達しました。${retryAfter}ミリ秒後に再試行します。`);
                        await new Promise(resolve => setTimeout(resolve, retryAfter));
                        attempt++;
                    } else {
                        log('error', 'Bot', `コマンド登録中にエラーが発生しました：${error.message}`);
                        log('error', 'Bot', `エラーの詳細：${JSON.stringify(error.response?.data || error)}`);
                        return;
                    }
                }
            }
            log('error', 'Bot', `最大リトライ回数に達しました。コマンドの登録に失敗しました。`);
        };

        log('info', 'Bot', 'グローバルコマンドを登録中...');
        await registerCommands(allCommands);

        log('info', 'Lavalink', 'MagmaStream Manager のインスタンスを作成中...');
        const nodes = [
            {
                host: '127.0.0.1',
                port: 8081,
                password: 'localhostlava',
                secure: false,
                identifier: 'メインLavalink-Server',
                retryAmount: 1000,
                retrydelay: 10000,
                resumeStatus: false,
                resumeTimeout: 1000
            }
        ];
        
        client.manager = new Manager({
            nodes,
            send: (id, payload) => {
                const guild = client.guilds.cache.get(id);
                if (guild) guild.shard.send(payload);
            }
        });

        client.manager.on('nodeConnect', (node) => {
            log('info', 'Lavalink', `MagmaStream ノードに接続されました：${node.options.identifier ?? '不明'}`);
        });

        client.manager.on('nodeError', (node, error) => {
            log('error', 'Lavalink', `MagmaStream ノードの接続に失敗しました：${node.options.identifier ?? '不明'}, エラー: ${error.message}`);
        });

        client.manager.on('nodeDisconnect', (node, reason) => {
            log('info', 'Lavalink', `MagmaStream ノードが切断されました：${node.options.identifier ?? '不明'}, 理由: ${reason}`);
        });

        log('info', 'Lavalink', 'MagmaStream ノードのイベントリスナーが設定されました。');

        try {
            await client.manager.init(client.user.id);
            log('info', 'Lavalink', 'MagmaStream ノードへの接続が成功しました。');
        } catch (error) {
            log('error', 'Lavalink', `MagmaStream ノードへの接続中にエラーが発生しました：${error.message}`);
        }

        client.on('raw', (data) => client.manager.updateVoiceState(data));

        try {
            await setActivity(client);
            log('info', 'Bot', 'アクティビティが正常に設定されました。');
        } catch (error) {
            log('error', 'Bot', `アクティビティ設定中にエラーが発生しました：${error.message}`);
        }
    } catch (error) {
        log('error', 'システム', `全体的なエラーが発生しました: ${error.message}`);
    }
};

module.exports = { handleReady };

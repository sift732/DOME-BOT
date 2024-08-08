const { setActivity } = require('./presences');
const { log } = require('./log');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { Routes, Collection } = require('discord.js');
const { SlashCommandBuilder, ContextMenuCommandBuilder } = require('@discordjs/builders');
const { Manager } = require('magmastream');

const handleReady = async (client) => {
    try {
        log('info', `ログインしました：${client.user.tag}`);
        
        const serverCount = client.guilds.cache.size;
        log('info', `導入サーバー数：${serverCount}`);

        const totalMembers = client.guilds.cache.reduce((total, guild) => total + guild.memberCount, 0);
        log('info', `累計メンバー数：${totalMembers}`);

        client.commands = new Collection();
        client.contextMenus = new Collection();

        const loadCommandsFromDirectories = (directories) => {
            const allCommands = [];
            
            directories.forEach(dir => {
                const commandFiles = fs.readdirSync(dir).filter(file => file.endsWith('.js'));
                for (const file of commandFiles) {
                    const filePath = path.join(dir, file);
                    const command = require(filePath);
                    if ('data' in command && 'execute' in command) {
                        if (command.data instanceof SlashCommandBuilder || command.data instanceof ContextMenuCommandBuilder) {
                            if (command.data instanceof ContextMenuCommandBuilder) {
                                client.contextMenus.set(command.data.name, command);
                            } else {
                                client.commands.set(command.data.name, command);
                            }
                            allCommands.push(command.data.toJSON ? command.data.toJSON() : command.data);
                        } else {
                            log('warning', `無効なコマンドファイル：${file}`);
                        }
                    }
                }
            });

            return allCommands;
        };

        const commandDirectories = [
            path.join(__dirname, '../admin'),
            path.join(__dirname, '../music'),
            path.join(__dirname, '../global'),
            path.join(__dirname, '../funny')
        ];

        const contextMenuDirectories = [
            path.join(__dirname, '../context')
        ];

        const allCommands = loadCommandsFromDirectories(commandDirectories);
        const allContextMenus = loadCommandsFromDirectories(contextMenuDirectories);

        log('info', '-------------------------------');
        log('info', `登録されたスラッシュコマンド数：${allCommands.length}`);
        log('info', `登録されたコンテキストメニューコマンド数：${allContextMenus.length}`);

        const axiosInstance = axios.create({
            baseURL: 'https://discord.com/api/v10',
            timeout: 30000,
            headers: {
                'Authorization': `Bot ${process.env.TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        const getExistingCommands = async () => {
            try {
                const response = await axiosInstance.get(Routes.applicationCommands(process.env.CLIENT_ID));
                return response.data;
            } catch (error) {
                log('error', `既存コマンドの取得中にエラーが発生しました：${error.message}`);
                return [];
            }
        };

        const registerCommands = async (commands) => {
            const existingCommands = await getExistingCommands();
            const existingCommandNames = new Set(existingCommands.map(cmd => cmd.name));

            const newCommands = commands.filter(cmd => !existingCommandNames.has(cmd.name));

            log('info', '-------------------------------');
            log('info', `既存のコマンド数：${existingCommands.length}`);
            log('info', `新規コマンド数：${newCommands.length}`);

            if (newCommands.length === 0) {
                log('info', '登録する新規コマンドはありません。');
                return;
            }

            const maxRetries = 2;
            let attempt = 0;
            while (attempt < maxRetries) {
                try {
                    await axiosInstance.put(Routes.applicationCommands(process.env.CLIENT_ID), newCommands);
                    log('info', '新規コマンドが正常に登録されました。');
                    return;
                } catch (error) {
                    if (error.response?.status === 429) {
                        const retryAfter = error.response.data.retry_after;
                        log('warning', `レートリミットに達しました ${retryAfter} ミリ秒後に再試行します`);
                        await new Promise(resolve => setTimeout(resolve, retryAfter));
                        attempt++;
                    } else {
                        log('error', `コマンド登録中にエラーが発生しました：${error.message}`);
                        log('error', `エラースタック：${error.stack}`);
                        log('error', `エラーの詳細：${JSON.stringify(error.response?.data || error)}`);
                        return;
                    }
                }
            }
            log('error', `最大リトライ回数に達しましたコマンドの登録に失敗しました。`);
        };

        log('info', 'グローバルコマンドを登録中...');
        await registerCommands([...allCommands, ...allContextMenus]);

        log('info', 'MagmaStream Manager のインスタンスを作成中...');
        const nodes = [
            {
                host: '127.0.0.1',
                port: 8081,
                password: 'localhostlava',
                secure: false,
                identifier: 'Node 1',
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
            log('info', `MagmaStream ノードに接続されました：${node.options.identifier ?? '不明'}`);
        });

        client.manager.on('nodeError', (node, error) => {
            log('error', `MagmaStream ノードの接続に失敗しました：${node.options.identifier ?? '不明'}, エラー: ${error.message}`);
        });

        client.manager.on('nodeDisconnect', (node, reason) => {
            log('info', `MagmaStream ノードが切断されました：${node.options.identifier ?? '不明'}, 理由: ${reason}`);
        });

        log('info', 'MagmaStream ノードのイベントリスナーが設定されました。');

        try {
            await client.manager.init(client.user.id);
            log('info', 'MagmaStream ノードへの接続が成功しました。');
        } catch (error) {
            log('error', `MagmaStream ノードへの接続中にエラーが発生しました：${error.message}`);
        }

        client.on('raw', (data) => client.manager.updateVoiceState(data));

        try {
            await setActivity(client);
            log('info', 'アクティビティが正常に設定されました。');
        } catch (error) {
            log('error', `アクティビティ設定中にエラーが発生しました：${error.message}`);
        }
    } catch (error) {
        log('error', `全体的なエラーが発生しました: ${error.message}`);
    }
};

module.exports = { handleReady };

const { setActivity } = require('./presences');
const { log } = require('./log');
const fs = require('fs');
const path = require('path');
const { REST, Routes, Collection } = require('discord.js');
const { SlashCommandBuilder, ContextMenuCommandBuilder } = require('@discordjs/builders');
const { Manager } = require('magmastream');

const handleReady = async (client) => {
    try {
        log('info', `ログインしました: ${client.user.tag}`);
        
        const serverCount = client.guilds.cache.size;
        log('info', `導入サーバー数: ${serverCount}`);

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
                            log('warn', `無効なコマンドファイル: ${file}`);
                        }
                    }
                }
            });

            return allCommands;
        }

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

        log('info', `登録されたコマンド数: ${allCommands.length}`);
        log('info', `登録されたコンテキストメニューコマンド数: ${allContextMenus.length}`);

        const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
        
        try {
            await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: allCommands });
            log('info', 'グローバルコマンドが正常に登録されました。');
        } catch (error) {
            log('error', `グローバルコマンド登録中にエラーが発生しました: ${error.message}`);
        }

        try {
            await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: allContextMenus });
            log('info', 'コンテキストメニューコマンドが正常に登録されました。');
        } catch (error) {
            log('error', `コンテキストメニューコマンド登録中にエラーが発生しました: ${error.message}`);
        }

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
            log('info', `MagmaStream ノードに接続されました: ${node.options.identifier ?? '不明'}`);
        });

        client.manager.on('nodeError', (node, error) => {
            log('error', `MagmaStream ノードの接続に失敗しました: ${node.options.identifier ?? '不明'}, エラー: ${error.message}`);
        });

        client.manager.on('nodeDisconnect', (node, reason) => {
            log('info', `MagmaStream ノードが切断されました: ${node.options.identifier ?? '不明'}, 理由: ${reason}`);
        });

        log('info', 'MagmaStream ノードのイベントリスナーが設定されました。');

        try {
            await client.manager.init(client.user.id);
            log('info', 'MagmaStream ノードへの接続が成功しました。');
        } catch (error) {
            log('error', `MagmaStream ノードへの接続中にエラーが発生しました: ${error.message}`);
        }

        client.on('raw', (data) => client.manager.updateVoiceState(data));

        try {
            await setActivity(client);
            log('info', 'アクティビティが正常に設定されました。');
        } catch (error) {
            log('error', `アクティビティ設定中にエラーが発生しました: ${error.message}`);
        }
    } catch (error) {
        log('error', `全体的なエラーが発生しました: ${error.message}`);
    }
};

module.exports = { handleReady };
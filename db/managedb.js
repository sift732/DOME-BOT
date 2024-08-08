const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const userDbPath = path.resolve('./db/blackuser.db');
const serverDbPath = path.resolve('./db/blackserver.db');
const globalChatDbPath = path.resolve('./db/globalchat.db');
const gbanDbPath = path.resolve('./db/gban.db');
const userDb = new sqlite3.Database(userDbPath, (err) => {
    if (err) {
        console.error('ユーザーデータベース接続エラー:', err.message);
    }
    userDb.run('CREATE TABLE IF NOT EXISTS blackusers (id TEXT PRIMARY KEY, reason TEXT)', (err) => {
        if (err) {
            console.error('ユーザーテーブル作成エラー:', err.message);
        }
    });
});

const serverDb = new sqlite3.Database(serverDbPath, (err) => {
    if (err) {
        console.error('サーバーデータベース接続エラー:', err.message);
    }
    serverDb.run('CREATE TABLE IF NOT EXISTS blackservers (id TEXT PRIMARY KEY, reason TEXT)', (err) => {
        if (err) {
            console.error('サーバーテーブル作成エラー:', err.message);
        }
    });
});

const globalChatDb = new sqlite3.Database(globalChatDbPath, (err) => {
    if (err) {
        console.error('グローバルチャットデータベース接続エラー:', err.message);
    }
    globalChatDb.run('CREATE TABLE IF NOT EXISTS global_chat (server_id TEXT PRIMARY KEY, channel_id TEXT NOT NULL, webhook_url TEXT NOT NULL)', (err) => {
        if (err) {
            console.error('グローバルチャットテーブル作成エラー:', err.message);
        }
    });
});

const gbanDb = new sqlite3.Database(gbanDbPath, (err) => {
    if (err) {
        console.error('グローバルBANデータベース接続エラー:', err.message);
    }
    gbanDb.run('CREATE TABLE IF NOT EXISTS global_bans (user_id TEXT PRIMARY KEY, reason TEXT, timestamp TEXT)', (err) => {
        if (err) {
            console.error('グローバルBANテーブル作成エラー:', err.message);
        }
    });
});

const isUserBlacklisted = (userId) => {
    return new Promise((resolve, reject) => {
        userDb.get('SELECT id FROM blackusers WHERE id = ?', [userId], (err, row) => {
            if (err) {
                return reject(err);
            }
            resolve(!!row);
        });
    });
};

const addUserToBlacklist = (userId, reason) => {
    return new Promise((resolve, reject) => {
        userDb.run('INSERT INTO blackusers (id, reason) VALUES (?, ?)', [userId, reason], function(err) {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
};

const removeUserFromBlacklist = (userId) => {
    return new Promise((resolve, reject) => {
        userDb.get('SELECT reason FROM blackusers WHERE id = ?', [userId], (err, row) => {
            if (err) {
                return reject(err);
            }
            const reason = row ? row.reason : null;
            
            userDb.run('DELETE FROM blackusers WHERE id = ?', [userId], function(err) {
                if (err) {
                    return reject(err);
                }
                resolve(reason);
            });
        });
    });
};

const isServerBlacklisted = (serverId) => {
    return new Promise((resolve, reject) => {
        serverDb.get('SELECT id FROM blackservers WHERE id = ?', [serverId], (err, row) => {
            if (err) {
                return reject(err);
            }
            resolve(!!row);
        });
    });
};

const addServerToBlacklist = (serverId, reason) => {
    return new Promise((resolve, reject) => {
        serverDb.run('INSERT INTO blackservers (id, reason) VALUES (?, ?)', [serverId, reason], function(err) {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
};

const removeServerFromBlacklist = (serverId) => {
    return new Promise((resolve, reject) => {
        serverDb.get('SELECT reason FROM blackservers WHERE id = ?', [serverId], (err, row) => {
            if (err) {
                return reject(err);
            }
            const reason = row ? row.reason : null;
            
            serverDb.run('DELETE FROM blackservers WHERE id = ?', [serverId], function(err) {
                if (err) {
                    return reject(err);
                }
                resolve(reason);
            });
        });
    });
};

const getUserBlacklist = () => {
    return new Promise((resolve, reject) => {
        userDb.all('SELECT id, reason FROM blackusers', [], (err, rows) => {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
};

const getServerBlacklist = () => {
    return new Promise((resolve, reject) => {
        serverDb.all('SELECT id, reason FROM blackservers', [], (err, rows) => {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
};

const addGlobalChatServer = (serverId, channelId, webhookUrl) => {
    return new Promise((resolve, reject) => {
        globalChatDb.run('INSERT INTO global_chat (server_id, channel_id, webhook_url) VALUES (?, ?, ?) ON CONFLICT(server_id) DO UPDATE SET channel_id = excluded.channel_id, webhook_url = excluded.webhook_url', [serverId, channelId, webhookUrl], function(err) {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
};

const removeGlobalChatServer = (serverId) => {
    return new Promise((resolve, reject) => {
        globalChatDb.run('DELETE FROM global_chat WHERE server_id = ?', [serverId], function(err) {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
};

const getGlobalChatServers = () => {
    return new Promise((resolve, reject) => {
        globalChatDb.all('SELECT server_id, channel_id, webhook_url FROM global_chat', [], (err, rows) => {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
};

const addGlobalBan = (userId, reason) => {
    return new Promise((resolve, reject) => {
        gbanDb.run('INSERT INTO global_bans (user_id, reason, timestamp) VALUES (?, ?, ?)', [userId, reason, new Date().toISOString()], function(err) {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
};

const removeGlobalBan = (userId) => {
    return new Promise((resolve, reject) => {
        gbanDb.get('SELECT reason FROM global_bans WHERE user_id = ?', [userId], (err, row) => {
            if (err) {
                return reject(err);
            }
            const reason = row ? row.reason : null;
            
            gbanDb.run('DELETE FROM global_bans WHERE user_id = ?', [userId], function(err) {
                if (err) {
                    return reject(err);
                }
                resolve(reason);
            });
        });
    });
};

const getGlobalBans = () => {
    return new Promise((resolve, reject) => {
        gbanDb.all('SELECT user_id, reason, timestamp FROM global_bans', [], (err, rows) => {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
};

module.exports = { 
    addUserToBlacklist, 
    isUserBlacklisted, 
    removeUserFromBlacklist,
    addServerToBlacklist,
    isServerBlacklisted,
    removeServerFromBlacklist,
    getUserBlacklist,
    getServerBlacklist,
    addGlobalChatServer,
    removeGlobalChatServer,
    getGlobalChatServers,
    addGlobalBan,
    removeGlobalBan,
    getGlobalBans
};
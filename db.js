const sqlite3 = require('sqlite3').verbose();

const dbUser = new sqlite3.Database('./blackuser.db', (err) => {
    if (err) {
        console.error('<❌> ユーザーのデータベース接続中にエラーが発生しました:', err.message);
    } else {
        console.log('<✅> ユーザーのデータベースに接続しました。');
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
        console.log('<✅> サーバーのデータベースに接続しました。');
        dbServer.run(`CREATE TABLE IF NOT EXISTS blacklisted_servers (
            server_id TEXT PRIMARY KEY
        )`);
    }
});

const dbUserData = new sqlite3.Database('./user_data.db', (err) => {
    if (err) {
        console.error('<❌> ユーザーデータベース接続中にエラーが発生しました:', err.message);
    } else {
        console.log('<✅> ユーザーデータベースに接続しました。');
        dbUserData.run(`CREATE TABLE IF NOT EXISTS user_money (
            user_id TEXT PRIMARY KEY,
            money INTEGER DEFAULT 0,
            last_job_timestamp INTEGER DEFAULT 0
        )`);
    }
});

async function addUserToBlacklist(userId, serverId) {
    return new Promise((resolve, reject) => {
        dbUser.run('INSERT INTO blacklisted_users (user_id, server_id) VALUES (?, ?)', [userId, serverId], function (err) {
            if (err) {
                reject(err);
            }
            resolve(this);
        });
    });
}

async function addServerToBlacklist(serverId) {
    return new Promise((resolve, reject) => {
        dbServer.run('INSERT INTO blacklisted_servers (server_id) VALUES (?)', [serverId], function (err) {
            if (err) {
                reject(err);
            }
            resolve(this);
        });
    });
}

async function removeUserFromBlacklist(userId, serverId) {
    return new Promise((resolve, reject) => {
        dbUser.run('DELETE FROM blacklisted_users WHERE user_id = ? AND server_id = ?', [userId, serverId], function (err) {
            if (err) {
                reject(err);
            }
            resolve(this);
        });
    });
}

async function removeServerFromBlacklist(serverId) {
    return new Promise((resolve, reject) => {
        dbServer.run('DELETE FROM blacklisted_servers WHERE server_id = ?', [serverId], function (err) {
            if (err) {
                reject(err);
            }
            resolve(this);
        });
    });
}

async function isUserBlacklisted(userId, serverId) {
    return new Promise((resolve, reject) => {
        dbUser.get('SELECT * FROM blacklisted_users WHERE user_id = ? AND server_id = ?', [userId, serverId], (err, row) => {
            if (err) {
                reject(err);
            }
            resolve(!!row);
        });
    });
}

async function isServerBlacklisted(serverId) {
    return new Promise((resolve, reject) => {
        dbServer.get('SELECT * FROM blacklisted_servers WHERE server_id = ?', [serverId], (err, row) => {
            if (err) {
                reject(err);
            }
            resolve(!!row);
        });
    });
}

async function getAllBlacklistedUsers() {
    return new Promise((resolve, reject) => {
        dbUser.all('SELECT * FROM blacklisted_users', (err, rows) => {
            if (err) {
                reject(err);
            }
            resolve(rows);
        });
    });
}

async function getAllBlacklistedServers() {
    return new Promise((resolve, reject) => {
        dbServer.all('SELECT * FROM blacklisted_servers', (err, rows) => {
            if (err) {
                reject(err);
            }
            resolve(rows);
        });
    });
}

async function getAllUserData() {
    return new Promise((resolve, reject) => {
        dbUserData.all('SELECT * FROM user_money', (err, rows) => {
            if (err) {
                reject(err);
            }
            resolve(rows);
        });
    });
}

module.exports = {
    addUserToBlacklist,
    addServerToBlacklist,
    removeUserFromBlacklist,
    removeServerFromBlacklist,
    isUserBlacklisted,
    isServerBlacklisted,
    getAllBlacklistedUsers,
    getAllBlacklistedServers,
    getAllUserData,
};
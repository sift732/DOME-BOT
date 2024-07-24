const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

// SQLite データベースの初期化
const db = new sqlite3.Database('./user_data.db', (err) => {
    if (err) {
        console.error('<❌> データベース接続中にエラーが発生しました:', err.message);
    } else {
        console.log('<✅> データベースに接続しました。');
        db.run(`CREATE TABLE IF NOT EXISTS user_money (
            user_id TEXT PRIMARY KEY,
            money INTEGER DEFAULT 0,
            last_job INTEGER DEFAULT 0  -- 最後に仕事をした時間のタイムスタンプ
        )`);
    }
});

async function getUserMoney(userId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT money FROM user_money WHERE user_id = ?', [userId], (err, row) => {
            if (err) {
                reject(err);
            }
            resolve(row ? row.money : 0);
        });
    });
}

async function updateUserMoney(userId, amount) {
    return new Promise((resolve, reject) => {
        db.run('INSERT OR REPLACE INTO user_money (user_id, money) VALUES (?, COALESCE((SELECT money FROM user_money WHERE user_id = ?), 0) + ?)', [userId, userId, amount], function (err) {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}

async function setUserMoney(userId, amount) {
    return new Promise((resolve, reject) => {
        db.run('UPDATE user_money SET money = ? WHERE user_id = ?', [amount, userId], function (err) {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}

async function resetUserMoney(userId) {
    return new Promise((resolve, reject) => {
        db.run('UPDATE user_money SET money = 0 WHERE user_id = ?', [userId], function (err) {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin_operation_money')
        .setDescription('指定したユーザーのお金を付与、設定、またはリセットします')
        .addStringOption(option =>
            option.setName('操作')
                .setDescription('操作の種類')
                .setRequired(true)
                .addChoices(
                    { name: '付与', value: 'add' },
                    { name: '設定', value: 'set' },
                    { name: 'リセット', value: 'reset' }))
        .addUserOption(option =>
            option.setName('ユーザー')
                .setDescription('操作を実行するユーザー')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('金額')
                .setDescription('操作に使用する金額')
                .setRequired(true)),

    async execute(interaction) {
        const adminId = process.env.ADMIN;
        if (interaction.user.id !== adminId) {
            const embed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle('権限エラー')
                .setDescription('このコマンドを実行する権限がありません。');

            return interaction.reply({ embeds: [embed] });
        }

        const operation = interaction.options.getString('操作');
        const user = interaction.options.getUser('ユーザー');
        const amount = interaction.options.getInteger('金額');

        if (!user || (operation === 'set' && amount === undefined)) {
            const embed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle('エラー')
                .setDescription('不正な引数が指定されました。');

            return interaction.reply({ embeds: [embed] });
        }

        const userId = user.id;

        try {
            if (operation === 'add') {
                await updateUserMoney(userId, amount);
                const embed = new MessageEmbed()
                    .setColor('#00ff00')
                    .setTitle('操作成功')
                    .setDescription(`ユーザー：${user.tag} に ${amount} の付与が完了しました`);

                return interaction.reply({ embeds: [embed] });
            } else if (operation === 'set') {
                await resetUserMoney(userId);
                await setUserMoney(userId, amount);
                const embed = new MessageEmbed()
                    .setColor('#00ff00')
                    .setTitle('操作成功')
                    .setDescription(`ユーザー：${user.tag} の設定が成功しました`);

                return interaction.reply({ embeds: [embed] });
            } else if (operation === 'reset') {
                await resetUserMoney(userId);
                const embed = new MessageEmbed()
                    .setColor('#00ff00')
                    .setTitle('操作成功')
                    .setDescription(`ユーザー：${user.tag} の ${amount} をリセットしました`);

                return interaction.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('操作中にエラーが発生しました:', error);
            const embed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle('エラー')
                .setDescription('操作中にエラーが発生しました。');

            return interaction.reply({ embeds: [embed] });
        }
    },
};
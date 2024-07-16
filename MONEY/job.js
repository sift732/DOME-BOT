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

// 指定された範囲の乱数を生成する関数
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ユーザーのお金を取得する関数
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

// ユーザーのお金を更新する関数
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

// ユーザーの最後の仕事の実行時間を更新する関数
async function updateLastJobTime(userId) {
    const currentTime = Math.floor(Date.now() / 1000); // 現在の時間を秒数で取得
    return new Promise((resolve, reject) => {
        db.run('UPDATE user_money SET last_job = ? WHERE user_id = ?', [currentTime, userId], function (err) {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}

// ユーザーの最後の仕事の実行時間を取得する関数
async function getLastJobTime(userId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT last_job FROM user_money WHERE user_id = ?', [userId], (err, row) => {
            if (err) {
                reject(err);
            }
            resolve(row ? row.last_job : 0);
        });
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('money_job')
        .setDescription('仕事をしてお金を稼ぎます'),

    async execute(interaction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const lastJobTime = await getLastJobTime(userId);
        const currentTime = Math.floor(Date.now() / 1000); // 現在の時間を秒数で取得

        // 15分経過していない場合はエラーメッセージを返す
        if (currentTime - lastJobTime < 900) {
            const remainingTime = 900 - (currentTime - lastJobTime);

            const minutes = Math.floor((remainingTime % 3600) / 60);
            const seconds = remainingTime % 60;

            const embed = new MessageEmbed()
                .setTitle('⏳ 次の仕事までの待ち時間')
                .setDescription(`次の仕事をするにはあと${minutes}分${seconds}秒待機してください`)
                .setColor('#ff0000');
            return interaction.followUp({ embeds: [embed] });
        }

        // 成功率を調整するための確率設定
        const successRate = 0.8; // 成功率80%
        const isSuccessful = Math.random() < successRate;

        if (isSuccessful) {
            // 成功した場合、ランダムな金額を獲得する
            let earnedMoney;
            if (Math.random() < 0.0001) {
                // 0.0001% の確率で大成功（5000から10000のランダムな金額）
                earnedMoney = getRandomInt(5000, 10000);
            } else {
                // 成功時の通常の範囲（1から1000のランダムな金額）
                earnedMoney = getRandomInt(1, 1000);
            }

            // ユーザーのお金を更新
            await updateUserMoney(userId, earnedMoney);

            const embed = new MessageEmbed()
                .setTitle('💰 仕事に成功')
                .setDescription(`仕事に成功し${earnedMoney}円のお金を稼ぎました。`)
                .setColor('#00ff00');
            await interaction.followUp({ embeds: [embed] });
        } else {
            // 失敗した場合、ランダムな金額を減額する
            const lostMoney = getRandomInt(1, 300);
            await updateUserMoney(userId, -lostMoney); // 減額した金額を負の値として扱う

            const embed = new MessageEmbed()
                .setTitle('💸 仕事に失敗')
                .setDescription(`仕事に失敗し上司から${lostMoney}円剥奪されました`)
                .setColor('#ff0000');
            await interaction.followUp({ embeds: [embed] });
        }

        // ユーザーの最後の仕事の実行時間を更新
        await updateLastJobTime(userId);
    },
};

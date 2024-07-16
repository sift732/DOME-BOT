const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./user_data.db', (err) => {
    if (err) {
        console.error('<❌> データベース接続中にエラーが発生しました:', err.message);
    } else {
        console.log('<✅> データベースに接続しました。');
        db.run(`CREATE TABLE IF NOT EXISTS user_money (
            user_id TEXT PRIMARY KEY,
            money INTEGER DEFAULT 0,
            last_job_timestamp INTEGER DEFAULT 0
        )`);
    }
});

async function getAllUsersMoney() {
    return new Promise((resolve, reject) => {
        db.all('SELECT SUM(money) AS totalMoney, AVG(money) AS averageMoney FROM user_money', (err, rows) => {
            if (err) {
                reject(err);
            }
            const result = rows[0] || { totalMoney: 0, averageMoney: 0 };
            resolve(result);
        });
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('money_average')
        .setDescription('全ユーザーの所持金と平均所持金を計算して表示します'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const { totalMoney, averageMoney } = await getAllUsersMoney();

            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('全ユーザーの所持金と平均所持金')
                .addField('全ユーザーの所持金合計', `${totalMoney}`, false) // フィールドの説明を非表示にする
                .addField('平均所持金', `${averageMoney.toFixed(2)}`, false); // フィールドの説明を非表示にする

            interaction.followUp({ embeds: [embed] });
        } catch (error) {
            console.error('全ユーザーの所持金と平均所持金の取得中にエラーが発生しました:', error);
            interaction.followUp('全ユーザーの所持金と平均所持金の取得中にエラーが発生しました。');
        }
    },
};

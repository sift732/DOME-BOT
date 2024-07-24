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
            last_job_timestamp INTEGER DEFAULT 0
        )`);
    }
});

// ユーザーのお金を取得する関数
async function getUserMoney(userId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT money FROM user_money WHERE user_id = ?', [userId], (err, row) => {
            if (err) {
                reject(err);
            }
            resolve(row ? row.money : null);
        });
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('money_now')
        .setDescription('所持しているお金を表示します')
        .addUserOption(option =>
            option.setName('ユーザー')
                .setDescription('お金を表示したいユーザー')
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const user = interaction.options.getUser('ユーザー') || interaction.user;
        const userId = user.id;

        try {
            // ユーザーのお金を取得
            const money = await getUserMoney(userId);

            let embed;
            if (money === null) {
                embed = new MessageEmbed()
                    .setColor('#ff0000')
                    .setTitle('エラー')
                    .setDescription(`${user.username}のデータが見つかりませんでした`);
            } else {
                embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle('所持しているお金')
                    .setDescription(`${user.username}が現在所持しているお金：\`${money}\``);
            }

            interaction.followUp({ embeds: [embed] });
        } catch (error) {
            console.error('お金の取得中にエラーが発生しました:', error);

            const errorEmbed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle('エラー')
                .setDescription('お金の取得中にエラーが発生しました。');

            interaction.followUp({ embeds: [errorEmbed] });
        }
    },
};

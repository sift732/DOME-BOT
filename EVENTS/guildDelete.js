const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const fs = require('fs');

const ADMIN_ID = process.env.ADMIN;

module.exports = {
    name: 'guildDelete',
    once: false,
    async execute(guild) {
        const owner = await guild.fetchOwner();
        
        if (owner) {
            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setLabel('回答する')
                        .setStyle('LINK')
                        .setURL('https://docs.google.com/forms/d/e/1FAIpQLSdgZKQAjWdsaSMjAVGJuNzs727iQ0BFSAV48qp0Nf7B4vpcAw/viewform')
                );
            const embed = new MessageEmbed()
                .setColor('RED')
                .setTitle('サーバーからの削除')
                .setDescription(`${guild.name}からボットが削除されました。お手数ですが、以下のボタンからアンケートにご回答お願いします`)

            try {
                await owner.send({ embeds: [embed], components: [row] });
                console.log(`アンケートのメッセージを${owner.user.tag}に送信しました。`);
                
                const admin = await owner.client.users.fetch(ADMIN_ID);
                if (admin) {
                    const logEmbed = new MessageEmbed()
                        .setColor('BLUE')
                        .setTitle('サーバー削除ログ')
                        .setDescription(`ボットがサーバー「${guild.name}」から削除され、オーナーにアンケートのメッセージを送信しました。`);
                    await admin.send({ embeds: [logEmbed] });
                } else {
                    console.error('管理者ユーザーを取得できませんでした。');
                }
            } catch (error) {
                console.error('オーナーにDMを送信できませんでした:', error);
            }
        } else {
            console.error('サーバーのオーナーを取得できませんでした。');
        }
    },
};

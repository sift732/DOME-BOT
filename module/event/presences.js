const { ActivityType } = require('discord.js');

const setActivity = async (client) => {
    try {
        const serverCount = client.guilds.cache.size;
        const totalMemberCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        
        await client.user.setActivity(`${serverCount}server ｜ ${totalMemberCount}member`, { type: ActivityType.Watching });
    } catch (error) {
        console.error('ステータスの設定中にエラーが発生しました:', error);
    }
};

module.exports = { setActivity };
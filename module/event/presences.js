const { ActivityType } = require('discord.js');
const { log } = require('./log');

let previousServerCount = 0;
let previousMemberCount = 0;

const setActivity = async (client) => {
    try {
        const serverCount = client.guilds.cache.size;
        const totalMemberCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        
        if (serverCount !== previousServerCount || totalMemberCount !== previousMemberCount) {
            previousServerCount = serverCount;
            previousMemberCount = totalMemberCount;

            await client.user.setActivity(`${serverCount} server ｜ ${totalMemberCount} member`, { type: ActivityType.Watching });
            log('info', 'Bot', 'アクティビティが更新されました。');
        } else {
        }
    } catch (error) {
        log('error', 'Bot', 'ステータスの設定中にエラーが発生しました:', error.message);
    }
};

module.exports = { setActivity };
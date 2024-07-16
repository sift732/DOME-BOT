const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
  name: 'guildCreate',
  async execute(guild, client) {
    let channel = guild.systemChannel;

    if (!channel || !channel.permissionsFor(guild.me).has('SEND_MESSAGES')) {
      channel = guild.channels.cache.find(
        ch => ch.type === 'GUILD_TEXT' && ch.permissionsFor(guild.me).has('SEND_MESSAGES')
      );
    }
    if (!channel) return;

    const embed = new MessageEmbed()
      .setTitle('導入通知')
      .setDescription(`**${guild.name}** に導入してくれてありがとうございます！`)
      .addField('製作者', 'rezulo4649', true)
      .addField('> <👀> 注意事項', '``/admin``から始まるコマンドは製作者のみ実行可能です。ご注意ください。')
      .addField('> <⏯️> 音楽', '``/music``から始まるコマンドは音楽関連の機能です。サーバーのみんなと音楽を共有しては？')
      .addField('> <💰> お金', '``/money``から始まるコマンドはお金関連のコマンドです。今後に登場する機能に使えるかも？')
      .addField('> <🔧> サーバー', '``/server``から始まるコマンドはサーバー関連のコマンドです。サーバー内の管理に使用してください。(coming soon)')
      .addField('> <🎫> バグ報告', '``/report <内容> <画像URLのみ(任意)> でレポートを送信できます``')
      .addField('> <❔> ヘルプ', '``/help``でBotのコマンドの詳細などが確認できます')
      .setThumbnail('https://b63bcd29-12c1-431c-a8ea-ba18d718ddb2-00-1yjzgqvntiwjd.pike.replit.dev/img/project.jpg')
      .setColor('#00ff00');

    const supportButton = new MessageButton()
      .setStyle('LINK')
      .setLabel('サポートサーバーへ')
      .setURL('https://discord.gg/kMw6fVWasa');

    const inviteButton = new MessageButton()
      .setStyle('LINK')
      .setLabel('BOTを招待する')
      .setURL('https://discord.com/oauth2/authorize?client_id=1250848150873182369&permissions=8&response_type=code&redirect_uri=+https%3A%2F%2Fdiscord.gg%2Fm9GgUEnbRA&integration_type=0&scope=identify+guilds+email+connections+bot+applications.commands');

    const actionRow = new MessageActionRow()
      .addComponents(supportButton, inviteButton);

    try {
      await channel.send({ embeds: [embed], components: [actionRow] });
    } catch (error) {
      console.error('Failed to send greeting message:', error);
    }
  },
};

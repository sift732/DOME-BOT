const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Displays available commands and their descriptions.'),
  async execute(interaction) {
    const filePath = '/home/darkguide/dome-bot/commands/commands.json'; // commands.json のファイルパス

    try {
      // ファイルの読み込み
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const commands = JSON.parse(fileContent);

      // コマンドを機能ごとに分類
      const categories = {
        music: commands.filter(command => command.name.startsWith('music_')),
        money: commands.filter(command => command.name.startsWith('money_')),
        // 追加のカテゴリがあればここに追加
      };

      // カテゴリごとの埋め込みメッセージを作成
      const embeds = Object.entries(categories).map(([category, cmds]) => {
        const embed = new MessageEmbed()
          .setTitle(`${category.charAt(0).toUpperCase() + category.slice(1)} Commands`)
          .setDescription(`Here are the ${category} commands and their descriptions:`)
          .setColor('#00ff00');

        cmds.forEach(command => {
          embed.addField(`\`/${command.name}\``, `**${command.description}**`);
        });

        return embed;
      });

      let currentPage = 0;

      const row = new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setCustomId('previous')
            .setLabel('前へ')
            .setStyle('PRIMARY')
            .setDisabled(currentPage === 0),
          new MessageButton()
            .setCustomId('next')
            .setLabel('次へ')
            .setStyle('PRIMARY')
            .setDisabled(currentPage === embeds.length - 1),
        );

      const message = await interaction.reply({ embeds: [embeds[currentPage]], components: [row], fetchReply: true });

      const filter = i => i.user.id === interaction.user.id;
      const collector = message.createMessageComponentCollector({ filter, time: 60000 });

      collector.on('collect', async i => {
        if (i.customId === 'previous') {
          currentPage--;
        } else if (i.customId === 'next') {
          currentPage++;
        }

        await i.update({
          embeds: [embeds[currentPage]],
          components: [new MessageActionRow()
            .addComponents(
              new MessageButton()
                .setCustomId('previous')
                .setLabel('前へ')
                .setStyle('PRIMARY')
                .setDisabled(currentPage === 0),
              new MessageButton()
                .setCustomId('next')
                .setLabel('次へ')
                .setStyle('PRIMARY')
                .setDisabled(currentPage === embeds.length - 1),
            )]
        });
      });

      collector.on('end', collected => {
        const disabledRow = new MessageActionRow()
          .addComponents(
            new MessageButton()
              .setCustomId('previous')
              .setLabel('前へ')
              .setStyle('PRIMARY')
              .setDisabled(true),
            new MessageButton()
              .setCustomId('next')
              .setLabel('次へ')
              .setStyle('PRIMARY')
              .setDisabled(true),
          );

        message.edit({ components: [disabledRow] });
      });

    } catch (error) {
      console.error('Failed to read commands.json:', error);
      await interaction.reply('Failed to fetch commands. Please try again later.');
    }
  },
};

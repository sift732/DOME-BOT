const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bot_help')
    .setDescription('ヘルプを表示します'),
  async execute(interaction) {
    const filePath = '/home/darkguide/dome-bot/COMMANDS/commands.json';

    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const commands = JSON.parse(fileContent);
      const categories = {
        money: commands.filter(cmd => cmd.name.startsWith('money')),
        music: commands.filter(cmd => cmd.name.startsWith('music')),
        server: commands.filter(cmd => cmd.name.startsWith('server')),
        admin: commands.filter(cmd => cmd.name.startsWith('admin')),
        bot: commands.filter(cmd => cmd.name.startsWith('bot')),
        weather: commands.filter(cmd => cmd.name.startsWith('weather')).map(cmd => {
          if (cmd.options) {
            cmd.options.forEach(option => {
              if (option.choices) {
                option.choices = option.choices.map(choice => ({ name: choice.name, value: choice.value }));
              }
            });
          }
          return cmd;
        }),
      };

      const embeds = Object.entries(categories).reduce((acc, [category, cmds]) => {
        const embed = new MessageEmbed()
          .setTitle(`${category.charAt(0).toUpperCase() + category.slice(1)} Commands`)
          .setColor('#00ff00');

        if (category === 'admin') {
          embed.setDescription('以下は製作者専用のコマンドです。');
          cmds.forEach(command => {
            if (command.options && command.options.length > 0) {
              embed.addField(`\`/${command.name}\``, `**${command.description}**\n**Options:**\n${command.options.map(opt => `\`--${opt.name}\` ${opt.description}`).join('\n')}`);
            } else {
              embed.addField(`\`/${command.name}\``, `**${command.description}**`);
            }
          });
        } else {
          if (cmds.length > 0) {
            embed.setDescription(`以下は${category}コマンドとその説明です`);
            cmds.forEach(command => {
              if (command.options && command.options.length > 0) {
                embed.addField(`\`/${command.name}\``, `**${command.description}**\n**Options:**\n${command.options.map(opt => `\`--${opt.name}\` ${opt.description}`).join('\n')}`);
              } else {
                embed.addField(`\`/${command.name}\``, `**${command.description}**`);
              }
            });
          } else {
            embed.setDescription(`現在、${category}カテゴリのコマンドはありません。`);
          }
        }

        acc.push(embed);
        return acc;
      }, []);

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
      await interaction.reply('コマンドの取得に失敗しました。後で再試行してください。');
    }
  },
};

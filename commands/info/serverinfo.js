const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('serverinfo')
		.setDescription('Get information about the server'),
	async execute(interaction) {
		const { guild } = interaction;

		const embed = new EmbedBuilder()
			.setColor('#0099ff')
			.setTitle('Server Information')
			.setThumbnail(guild.iconURL({ dynamic: true }))
			.addFields(
				{ name: 'Server Name', value: guild.name, inline: true },
				{ name: 'Server ID', value: guild.id, inline: true },
				{ name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
				{ name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
				{ name: 'Members', value: `${guild.memberCount}`, inline: true },
				{ name: 'Boost Level', value: `Level ${guild.premiumTier}`, inline: true },
				{ name: 'Boost Count', value: `${guild.premiumSubscriptionCount || 0}`, inline: true },
				{ name: 'Roles', value: `${guild.roles.cache.size}`, inline: true },
				{ name: 'Emojis', value: `${guild.emojis.cache.size}`, inline: true },
				{ name: 'Text Channels', value: `${guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size}`, inline: true },
				{ name: 'Voice Channels', value: `${guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size}`, inline: true },
				{ name: 'Verification Level', value: guild.verificationLevel.toString(), inline: true }
			);

		if (guild.iconURL()) {
			embed.setThumbnail(guild.iconURL({ size: 256 }));
		}

		if (guild.bannerURL()) {
			embed.setImage(guild.bannerURL({ size: 1024 }));
		}

		await interaction.reply({ embeds: [embed] });
	},
};

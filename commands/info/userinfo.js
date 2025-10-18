const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('userinfo')
		.setDescription('Get information about a user')
		.addUserOption(option =>
			option.setName('user')
				.setDescription('The user to get info about')),
	async execute(interaction) {
		const user = interaction.options.getUser('user') || interaction.user;
		const member = interaction.guild.members.cache.get(user.id);

		const embed = new EmbedBuilder()
			.setColor('#0099ff')
			.setTitle('User Information')
			.setThumbnail(user.displayAvatarURL({ dynamic: true }))
			.addFields(
				{ name: 'Username', value: user.tag, inline: true },
				{ name: 'ID', value: user.id, inline: true },
				{ name: 'Bot', value: user.bot ? 'Yes' : 'No', inline: true },
				{ name: 'Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true }
			);

		if (member) {
			embed.addFields(
				{ name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
				{ name: 'Roles', value: member.roles.cache.filter(r => r.id !== interaction.guild.id).map(r => r.toString()).join(', ') || 'None', inline: false }
			);
		}

		await interaction.reply({ embeds: [embed] });
	},
};

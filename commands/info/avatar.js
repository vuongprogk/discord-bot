const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('avatar')
		.setDescription('Get user avatar')
		.addUserOption(option =>
			option.setName('user')
				.setDescription('The user to get avatar from')),
	async execute(interaction) {
		const user = interaction.options.getUser('user') || interaction.user;
		
		const embed = new EmbedBuilder()
			.setColor('#0099ff')
			.setTitle(`${user.username}'s Avatar`)
			.setImage(user.displayAvatarURL({ size: 1024, dynamic: true }))
			.addFields(
				{ name: 'PNG', value: `[Link](${user.displayAvatarURL({ size: 1024, extension: 'png' })})`, inline: true },
				{ name: 'JPG', value: `[Link](${user.displayAvatarURL({ size: 1024, extension: 'jpg' })})`, inline: true },
				{ name: 'WEBP', value: `[Link](${user.displayAvatarURL({ size: 1024, extension: 'webp' })})`, inline: true }
			);

		await interaction.reply({ embeds: [embed] });
	},
};

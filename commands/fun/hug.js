const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('hug')
		.setDescription('Hug someone!')
		.addUserOption(option =>
			option.setName('user')
				.setDescription('The user to hug')
				.setRequired(true)),
	async execute(interaction) {
		const user = interaction.options.getUser('user');
		const hugGifs = [
			'https://media.giphy.com/media/l2QDM9Jnim1YVILXa/giphy.gif',
			'https://media.giphy.com/media/3bqtLDeiDtwhq/giphy.gif',
			'https://media.giphy.com/media/lrr9rHuoJOE0w/giphy.gif',
			'https://media.giphy.com/media/143v0Z4767T15e/giphy.gif',
		];

		const randomGif = hugGifs[Math.floor(Math.random() * hugGifs.length)];

		const { EmbedBuilder } = require('discord.js');
		const embed = new EmbedBuilder()
			.setColor('#FF69B4')
			.setDescription(`🤗 **${interaction.user.username}** hugs **${user.username}**!`)
			.setImage(randomGif);

		await interaction.reply({ embeds: [embed] });
	},
};

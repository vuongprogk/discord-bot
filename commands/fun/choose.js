const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('choose')
		.setDescription('Let the bot choose for you!')
		.addStringOption(option =>
			option.setName('choices')
				.setDescription('Separate choices with commas (e.g., pizza, burger, sushi)')
				.setRequired(true)),
	async execute(interaction) {
		const input = interaction.options.getString('choices');
		const choices = input.split(',').map(c => c.trim()).filter(c => c.length > 0);
		
		if (choices.length < 2) {
			await interaction.reply('❌ Please provide at least 2 choices separated by commas!');
			return;
		}
		
		const chosen = choices[Math.floor(Math.random() * choices.length)];
		
		await interaction.reply(`🤔 I choose... **${chosen}**!`);
	},
};

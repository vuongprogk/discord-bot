const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reverse')
		.setDescription('Reverse your text!')
		.addStringOption(option =>
			option.setName('text')
				.setDescription('Text to reverse')
				.setRequired(true)),
	async execute(interaction) {
		const text = interaction.options.getString('text');
		const reversed = text.split('').reverse().join('');
		
		await interaction.reply(`🔄 **Reversed:** ${reversed}`);
	},
};

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('mock')
		.setDescription('MoCk YoUr TeXt LiKe ThIs!')
		.addStringOption(option =>
			option.setName('text')
				.setDescription('Text to mock')
				.setRequired(true)),
	async execute(interaction) {
		const text = interaction.options.getString('text');
		
		const mocked = text
			.split('')
			.map((char, i) => i % 2 === 0 ? char.toLowerCase() : char.toUpperCase())
			.join('');
		
		await interaction.reply(`🤡 ${mocked}`);
	},
};

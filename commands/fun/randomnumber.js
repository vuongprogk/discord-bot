const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('randomnumber')
		.setDescription('Generate a random number')
		.addIntegerOption(option =>
			option.setName('min')
				.setDescription('Minimum value (default: 1)')
				.setMinValue(-1000000))
		.addIntegerOption(option =>
			option.setName('max')
				.setDescription('Maximum value (default: 100)')
				.setMaxValue(1000000)),
	async execute(interaction) {
		const min = interaction.options.getInteger('min') || 1;
		const max = interaction.options.getInteger('max') || 100;

		if (min >= max) {
			return interaction.reply({ content: '❌ Minimum must be less than maximum!', flags: MessageFlags.Ephemeral });
		}

		const random = Math.floor(Math.random() * (max - min + 1)) + min;

		await interaction.reply(`🎲 Random number between ${min} and ${max}: **${random}**`);
	},
};

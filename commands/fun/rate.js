const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rate')
		.setDescription('Rate something from 0 to 10!')
		.addStringOption(option =>
			option.setName('thing')
				.setDescription('What should I rate?')
				.setRequired(true)),
	async execute(interaction) {
		const thing = interaction.options.getString('thing');
		const rating = Math.floor(Math.random() * 11); // 0-10
		
		let emoji = '😐';
		if (rating >= 9) emoji = '🤩';
		else if (rating >= 7) emoji = '😊';
		else if (rating >= 5) emoji = '😐';
		else if (rating >= 3) emoji = '😕';
		else emoji = '🤮';
		
		const bars = '█'.repeat(rating) + '░'.repeat(10 - rating);
		
		await interaction.reply(`${emoji} I rate **${thing}** a **${rating}/10**!\n\`${bars}\``);
	},
};

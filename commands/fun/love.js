const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('love')
		.setDescription('Calculate love compatibility between two users!')
		.addUserOption(option =>
			option.setName('person1')
				.setDescription('First person')
				.setRequired(true))
		.addUserOption(option =>
			option.setName('person2')
				.setDescription('Second person')
				.setRequired(true)),
	async execute(interaction) {
		const person1 = interaction.options.getUser('person1');
		const person2 = interaction.options.getUser('person2');
		
		// Generate consistent "random" percentage based on user IDs
		const seed = BigInt(person1.id) + BigInt(person2.id);
		const percentage = Number(seed % 101n);
		
		let message = '';
		let emoji = '❤️';
		
		if (percentage >= 90) {
			message = 'Perfect match! 💕';
			emoji = '💖';
		} else if (percentage >= 70) {
			message = 'Great compatibility! 💕';
			emoji = '💝';
		} else if (percentage >= 50) {
			message = 'Could work out! 💕';
			emoji = '💗';
		} else if (percentage >= 30) {
			message = 'Not the best match... 💔';
			emoji = '💔';
		} else {
			message = 'Maybe just friends? 💔';
			emoji = '💔';
		}
		
		const hearts = '💖'.repeat(Math.floor(percentage / 10));
		const broken = '💔'.repeat(10 - Math.floor(percentage / 10));
		
		await interaction.reply(
			`${emoji} **Love Calculator** ${emoji}\n\n` +
			`${person1.username} + ${person2.username}\n\n` +
			`${hearts}${broken}\n\n` +
			`**${percentage}%** - ${message}`
		);
	},
};

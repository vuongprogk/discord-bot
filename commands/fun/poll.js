const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('poll')
		.setDescription('Create a poll')
		.addStringOption(option =>
			option.setName('question')
				.setDescription('The poll question')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('option1')
				.setDescription('First option')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('option2')
				.setDescription('Second option')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('option3')
				.setDescription('Third option'))
		.addStringOption(option =>
			option.setName('option4')
				.setDescription('Fourth option')),
	async execute(interaction) {
		const question = interaction.options.getString('question');
		const options = [
			interaction.options.getString('option1'),
			interaction.options.getString('option2'),
			interaction.options.getString('option3'),
			interaction.options.getString('option4')
		].filter(opt => opt !== null);

		const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];
		const description = options.map((opt, i) => `${emojis[i]} ${opt}`).join('\n\n');

		const embed = new EmbedBuilder()
			.setColor('#0099ff')
			.setTitle('📊 ' + question)
			.setDescription(description)
			.setFooter({ text: `Poll by ${interaction.user.tag}` })
			.setTimestamp();

		const message = await interaction.reply({ embeds: [embed], fetchReply: true });

		for (let i = 0; i < options.length; i++) {
			await message.react(emojis[i]);
		}
	},
};

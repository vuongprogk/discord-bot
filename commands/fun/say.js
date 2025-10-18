const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('say')
		.setDescription('Make the bot say something')
		.addStringOption(option =>
			option.setName('message')
				.setDescription('What should the bot say?')
				.setRequired(true))
		.addBooleanOption(option =>
			option.setName('embed')
				.setDescription('Send as an embed?')),
	async execute(interaction) {
		const message = interaction.options.getString('message');
		const useEmbed = interaction.options.getBoolean('embed') || false;

		await interaction.reply({ content: '✅ Message sent!', ephemeral: true });

		if (useEmbed) {
			const { EmbedBuilder } = require('discord.js');
			const embed = new EmbedBuilder()
				.setColor('#0099ff')
				.setDescription(message);
			await interaction.channel.send({ embeds: [embed] });
		} else {
			await interaction.channel.send(message);
		}
	},
};

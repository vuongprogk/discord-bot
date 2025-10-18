const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('meme')
		.setDescription('Get a random meme!'),
	async execute(interaction) {
		await interaction.deferReply();

		try {
			const response = await fetch('https://meme-api.com/gimme');
			const data = await response.json();

			const embed = new EmbedBuilder()
				.setColor('#FF4500')
				.setTitle(data.title)
				.setImage(data.url)
				.setFooter({ text: `👍 ${data.ups} | r/${data.subreddit}` })
				.setURL(data.postLink);

			await interaction.editReply({ embeds: [embed] });
		} catch (error) {
			console.error(error);
			await interaction.editReply({ content: '❌ Failed to fetch a meme. Try again later!' });
		}
	},
};

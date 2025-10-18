const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('dadjoke')
		.setDescription('Get a random dad joke!'),
	async execute(interaction) {
		const jokes = [
			{ setup: "Why don't scientists trust atoms?", punchline: "Because they make up everything!" },
			{ setup: "What do you call a fake noodle?", punchline: "An impasta!" },
			{ setup: "Why did the scarecrow win an award?", punchline: "He was outstanding in his field!" },
			{ setup: "What do you call a bear with no teeth?", punchline: "A gummy bear!" },
			{ setup: "Why don't eggs tell jokes?", punchline: "They'd crack each other up!" },
			{ setup: "What's the best thing about Switzerland?", punchline: "I don't know, but the flag is a big plus!" },
			{ setup: "How do you organize a space party?", punchline: "You planet!" },
			{ setup: "Why did the coffee file a police report?", punchline: "It got mugged!" },
			{ setup: "What did the ocean say to the beach?", punchline: "Nothing, it just waved!" },
			{ setup: "Why can't you hear a pterodactyl go to the bathroom?", punchline: "Because the 'P' is silent!" },
		];
		
		const joke = jokes[Math.floor(Math.random() * jokes.length)];
		
		const embed = new EmbedBuilder()
			.setColor('#FFA500')
			.setTitle('🤣 Dad Joke')
			.setDescription(`**${joke.setup}**\n\n||${joke.punchline}||`)
			.setFooter({ text: 'Click the spoiler to see the punchline!' });
		
		await interaction.reply({ embeds: [embed] });
	},
};

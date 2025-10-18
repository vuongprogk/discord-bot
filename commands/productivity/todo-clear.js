const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { todoDB } = require('../../database.ts');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('todo-clear')
		.setDescription('Clear all completed todos (private)'),
	async execute(interaction) {
		try {
			const deleted = await todoDB.clearCompleted(
				interaction.user.id,
				interaction.guild.id
			);

			if (deleted.length === 0) {
				return await interaction.reply({
					content: '📋 No completed todos to clear.',
					flags: MessageFlags.Ephemeral
				});
			}

			const embed = new EmbedBuilder()
				.setColor('#00ff00')
				.setTitle('🗑️ Completed Todos Cleared')
				.setDescription(`Successfully removed ${deleted.length} completed todo${deleted.length > 1 ? 's' : ''}.`)
				.setTimestamp();

			await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
		} catch (error) {
			console.error(error);
			await interaction.reply({
				content: '❌ Failed to clear completed todos. Please try again.',
				flags: MessageFlags.Ephemeral
			});
		}
	},
};

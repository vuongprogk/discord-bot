const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { todoDB } = require('../../database.ts');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('todo-delete')
		.setDescription('Delete a todo item (private)')
		.addIntegerOption(option =>
			option.setName('id')
				.setDescription('Todo ID to delete')
				.setRequired(true)),
	async execute(interaction) {
		try {
			const id = interaction.options.getInteger('id');
			
			const todo = await todoDB.deleteTodo(
				id,
				interaction.user.id,
				interaction.guild.id
			);

			if (!todo) {
				return await interaction.reply({
					content: '❌ Todo not found or you don\'t have permission to delete it.',
					flags: MessageFlags.Ephemeral
				});
			}

			await interaction.reply({
				content: `🗑️ Todo #${id} "${todo.title}" has been deleted successfully!`,
				flags: MessageFlags.Ephemeral
			});
		} catch (error) {
			console.error(error);
			await interaction.reply({
				content: '❌ Failed to delete todo. Please try again.',
				flags: MessageFlags.Ephemeral
			});
		}
	},
};

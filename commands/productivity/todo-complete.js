const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { todoDB } = require('../../database.ts');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('todo-complete')
		.setDescription('Toggle todo completion status (private)')
		.addIntegerOption(option =>
			option.setName('id')
				.setDescription('Todo ID to toggle')
				.setRequired(true)),
	async execute(interaction) {
		try {
			const id = interaction.options.getInteger('id');
			
			const todo = await todoDB.toggleTodo(
				id,
				interaction.user.id,
				interaction.guild.id
			);

			if (!todo) {
				return await interaction.reply({
					content: '❌ Todo not found or you don\'t have permission to modify it.',
					flags: MessageFlags.Ephemeral
				});
			}

			const status = todo.completed ? '✅ Completed' : '⬜ Reopened';
			const emoji = todo.completed ? '🎉' : '🔄';

			await interaction.reply({
				content: `${emoji} Todo #${id} "${todo.title}" has been marked as ${status}`,
				flags: MessageFlags.Ephemeral
			});
		} catch (error) {
			console.error(error);
			await interaction.reply({
				content: '❌ Failed to update todo. Please try again.',
				flags: MessageFlags.Ephemeral
			});
		}
	},
};

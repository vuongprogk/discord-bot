const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { expenseDB } = require('../../database.ts');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('expense-delete')
		.setDescription('Delete an expense by ID (private)')
		.addIntegerOption(option =>
			option.setName('id')
				.setDescription('Expense ID to delete')
				.setRequired(true)),
	async execute(interaction) {
		try {
			const id = interaction.options.getInteger('id');
			
			const deleted = await expenseDB.deleteExpense(
				id,
				interaction.user.id,
				interaction.guild.id
			);

			if (!deleted) {
				return await interaction.reply({
					content: '❌ Expense not found or you don\'t have permission to delete it.',
					flags: MessageFlags.Ephemeral
				});
			}

			await interaction.reply({
				content: `✅ Expense ID ${id} has been deleted successfully!\nAmount: $${parseFloat(deleted.amount).toFixed(2)}`,
				flags: MessageFlags.Ephemeral
			});
		} catch (error) {
			console.error(error);
			await interaction.reply({
				content: '❌ Failed to delete expense. Please try again.',
				flags: MessageFlags.Ephemeral
			});
		}
	},
};

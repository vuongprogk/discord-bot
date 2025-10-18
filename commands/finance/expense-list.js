const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { expenseDB } = require('../../database.ts');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('expense-list')
		.setDescription('View your recent expenses (private)')
		.addIntegerOption(option =>
			option.setName('limit')
				.setDescription('Number of expenses to show (default: 10)')
				.setMinValue(1)
				.setMaxValue(25)),
	async execute(interaction) {
		try {
			const limit = interaction.options.getInteger('limit') || 10;
			const expenses = await expenseDB.getExpenses(
				interaction.user.id,
				interaction.guild.id,
				limit
			);

			if (expenses.length === 0) {
				return await interaction.reply({
					content: '📊 You have no expenses recorded yet. Use `/expense-add` to add one!',
					flags: MessageFlags.Ephemeral
				});
			}

			const categoryEmojis = {
				food: '🍔',
				transport: '🚗',
				housing: '🏠',
				shopping: '🛒',
				healthcare: '💊',
				entertainment: '🎮',
				bills: '📱',
				travel: '✈️',
				education: '📚',
				other: '💼'
			};

			const expenseList = expenses.map(expense => {
				const date = new Date(expense.created_at).toLocaleDateString();
				const emoji = categoryEmojis[expense.category] || '💼';
				return `${emoji} **$${parseFloat(expense.amount).toFixed(2)}** - ${expense.category}\n` +
					   `   *${expense.description}* (${date})`;
			}).join('\n\n');

			const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

			const embed = new EmbedBuilder()
				.setColor('#0099ff')
				.setTitle('💰 Your Recent Expenses')
				.setDescription(expenseList)
				.addFields(
					{ name: 'Total Shown', value: `$${total.toFixed(2)}`, inline: true },
					{ name: 'Count', value: `${expenses.length} expenses`, inline: true }
				)
				.setFooter({ text: 'Showing most recent expenses' })
				.setTimestamp();

			await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
		} catch (error) {
			console.error(error);
			await interaction.reply({
				content: '❌ Failed to fetch expenses. Please try again.',
				flags: MessageFlags.Ephemeral
			});
		}
	},
};

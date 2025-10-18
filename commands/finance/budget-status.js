const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { budgetDB, expenseDB } = require('../../database.ts');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('budget-status')
		.setDescription('Check your budget status (private)'),
	async execute(interaction) {
		try {
			const budgets = await budgetDB.getBudgets(
				interaction.user.id,
				interaction.guild.id
			);

			if (budgets.length === 0) {
				return await interaction.reply({
					content: '📊 You haven\'t set any budgets yet. Use `/budget-set` to create one!',
					flags: MessageFlags.Ephemeral
				});
			}

			const now = new Date();
			const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
			const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

			const expenses = await expenseDB.getExpensesByDateRange(
				interaction.user.id,
				interaction.guild.id,
				monthStart,
				monthEnd
			);

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

			const budgetList = budgets.map(budget => {
				const spent = expenses
					.filter(e => e.category === budget.category)
					.reduce((sum, e) => sum + parseFloat(e.amount), 0);

				const budgetAmount = parseFloat(budget.amount);
				const remaining = budgetAmount - spent;
				const percentage = (spent / budgetAmount) * 100;

				const emoji = categoryEmojis[budget.category] || '💼';
				const statusEmoji = percentage > 100 ? '🔴' : percentage > 80 ? '🟡' : '🟢';
				const bar = '█'.repeat(Math.min(Math.round(percentage / 5), 20));
				const emptyBar = '░'.repeat(Math.max(20 - Math.round(percentage / 5), 0));

				return `${statusEmoji} ${emoji} **${budget.category}**\n` +
					   `Budget: $${budgetAmount.toFixed(2)} | Spent: $${spent.toFixed(2)} | Remaining: $${remaining.toFixed(2)}\n` +
					   `\`${bar}${emptyBar}\` ${percentage.toFixed(1)}%`;
			}).join('\n\n');

			const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.amount), 0);
			const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

			const embed = new EmbedBuilder()
				.setColor('#0099ff')
				.setTitle('💰 Budget Status - This Month')
				.setDescription(budgetList)
				.addFields(
					{ name: 'Total Budget', value: `$${totalBudget.toFixed(2)}`, inline: true },
					{ name: 'Total Spent', value: `$${totalSpent.toFixed(2)}`, inline: true },
					{ name: 'Remaining', value: `$${(totalBudget - totalSpent).toFixed(2)}`, inline: true }
				)
				.setFooter({ text: `Period: ${monthStart.toLocaleDateString()} - ${monthEnd.toLocaleDateString()}` })
				.setTimestamp();

			await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
		} catch (error) {
			console.error(error);
			await interaction.reply({
				content: '❌ Failed to fetch budget status. Please try again.',
				flags: MessageFlags.Ephemeral
			});
		}
	},
};

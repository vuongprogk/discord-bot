const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { expenseDB } = require('../../database.ts');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('expense')
		.setDescription('Manage your personal expenses')
		.addSubcommand(subcommand =>
			subcommand
				.setName('add')
				.setDescription('Add a new expense (private)')
				.addNumberOption(option =>
					option.setName('amount')
						.setDescription('Amount spent')
						.setRequired(true)
						.setMinValue(0.01))
				.addStringOption(option =>
					option.setName('category')
						.setDescription('Expense category')
						.setRequired(true)
						.addChoices(
							{ name: '🍔 Food & Dining', value: 'food' },
							{ name: '🚗 Transportation', value: 'transport' },
							{ name: '🏠 Housing', value: 'housing' },
							{ name: '🛒 Shopping', value: 'shopping' },
							{ name: '💊 Healthcare', value: 'healthcare' },
							{ name: '🎮 Entertainment', value: 'entertainment' },
							{ name: '📱 Bills & Utilities', value: 'bills' },
							{ name: '✈️ Travel', value: 'travel' },
							{ name: '📚 Education', value: 'education' },
							{ name: '💼 Other', value: 'other' }
						))
				.addStringOption(option =>
					option.setName('description')
						.setDescription('Description of the expense')
						.setRequired(false)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('list')
				.setDescription('View your recent expenses (private)')
				.addIntegerOption(option =>
					option.setName('limit')
						.setDescription('Number of expenses to show (default: 10)')
						.setMinValue(1)
						.setMaxValue(25)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('summary')
				.setDescription('View your expense summary (private)')
				.addStringOption(option =>
					option.setName('period')
						.setDescription('Time period')
						.addChoices(
							{ name: 'This Month', value: 'month' },
							{ name: 'This Year', value: 'year' },
							{ name: 'All Time', value: 'all' }
						)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('delete')
				.setDescription('Delete an expense by ID (private)')
				.addIntegerOption(option =>
					option.setName('id')
						.setDescription('Expense ID to delete')
						.setRequired(true))),
	
	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();

		try {
			switch (subcommand) {
				case 'add':
					await this.handleAdd(interaction);
					break;
				case 'list':
					await this.handleList(interaction);
					break;
				case 'summary':
					await this.handleSummary(interaction);
					break;
				case 'delete':
					await this.handleDelete(interaction);
					break;
			}
		} catch (error) {
			console.error(error);
			await interaction.reply({
				content: '❌ An error occurred while processing your request.',
				flags: MessageFlags.Ephemeral
			});
		}
	},

	async handleAdd(interaction) {
		const amount = interaction.options.getNumber('amount');
		const category = interaction.options.getString('category');
		const description = interaction.options.getString('description') || 'No description';

		const expense = await expenseDB.addExpense(
			interaction.user.id,
			interaction.guild.id,
			amount,
			category,
			description
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

		const embed = new EmbedBuilder()
			.setColor('#00ff00')
			.setTitle('✅ Expense Added')
			.addFields(
				{ name: 'Amount', value: `$${amount.toFixed(2)}`, inline: true },
				{ name: 'Category', value: `${categoryEmojis[category]} ${category}`, inline: true },
				{ name: 'Description', value: description }
			)
			.setFooter({ text: `Expense ID: ${expense.id}` })
			.setTimestamp();

		await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
	},

	async handleList(interaction) {
		const limit = interaction.options.getInteger('limit') || 10;
		const expenses = await expenseDB.getExpenses(
			interaction.user.id,
			interaction.guild.id,
			limit
		);

		if (expenses.length === 0) {
			return await interaction.reply({
				content: '📊 You have no expenses recorded yet. Use `/expense add` to add one!',
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
			const date = new Date(expense.createdAt).toLocaleDateString();
			const emoji = categoryEmojis[expense.category] || '💼';
			return `${emoji} **$${parseFloat(expense.amount).toFixed(2)}** - ${expense.category}\n` +
				   `   *${expense.description}* (${date}) [ID: ${expense.id}]`;
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
	},

	async handleSummary(interaction) {
		const period = interaction.options.getString('period') || 'month';
		
		let startDate, endDate;
		const now = new Date();
		
		if (period === 'month') {
			startDate = new Date(now.getFullYear(), now.getMonth(), 1);
			endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
		} else if (period === 'year') {
			startDate = new Date(now.getFullYear(), 0, 1);
			endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
		} else {
			startDate = new Date(0);
			endDate = now;
		}

		const summary = await expenseDB.getCategorySummary(
			interaction.user.id,
			interaction.guild.id,
			startDate,
			endDate
		);

		if (summary.length === 0) {
			return await interaction.reply({
				content: '📊 No expenses found for this period. Use `/expense add` to add one!',
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

		const totalAmount = summary.reduce((sum, cat) => sum + parseFloat(cat.total), 0);

		const categoryList = summary.map(cat => {
			const percentage = ((parseFloat(cat.total) / totalAmount) * 100).toFixed(1);
			const emoji = categoryEmojis[cat.category] || '💼';
			const bar = '█'.repeat(Math.round(percentage / 5));
			return `${emoji} **${cat.category}**: $${parseFloat(cat.total).toFixed(2)} (${percentage}%)\n\`${bar}\` ${cat.count} transactions`;
		}).join('\n\n');

		const periodText = period === 'month' ? 'This Month' : period === 'year' ? 'This Year' : 'All Time';

		const embed = new EmbedBuilder()
			.setColor('#ffcc00')
			.setTitle(`📊 Expense Summary - ${periodText}`)
			.setDescription(categoryList)
			.addFields(
				{ name: 'Total Spent', value: `**$${totalAmount.toFixed(2)}**`, inline: true },
				{ name: 'Categories', value: `${summary.length}`, inline: true },
				{ name: 'Transactions', value: `${summary.reduce((sum, cat) => sum + parseInt(cat.count), 0)}`, inline: true }
			)
			.setFooter({ text: `Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}` })
			.setTimestamp();

		await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
	},

	async handleDelete(interaction) {
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
	}
};

const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { budgetDB } = require('../../database.ts');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('budget')
		.setDescription('Manage your budgets')
		.addSubcommand(subcommand =>
			subcommand
				.setName('set')
				.setDescription('Set a budget for a category (private)')
				.addStringOption(option =>
					option.setName('category')
						.setDescription('Budget category')
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
				.addNumberOption(option =>
					option.setName('amount')
						.setDescription('Budget amount')
						.setRequired(true)
						.setMinValue(0.01))
				.addStringOption(option =>
					option.setName('period')
						.setDescription('Budget period (default: monthly)')
						.addChoices(
							{ name: 'Monthly', value: 'monthly' },
							{ name: 'Yearly', value: 'yearly' }
						)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('status')
				.setDescription('View your budget status (private)')),
	
	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();

		try {
			switch (subcommand) {
				case 'set':
					await this.handleSet(interaction);
					break;
				case 'status':
					await this.handleStatus(interaction);
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

	async handleSet(interaction) {
		const category = interaction.options.getString('category');
		const amount = interaction.options.getNumber('amount');
		const period = interaction.options.getString('period') || 'monthly';

		const budget = await budgetDB.setBudget(
			interaction.user.id,
			interaction.guild.id,
			category,
			amount,
			period
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
			.setTitle('✅ Budget Set Successfully')
			.addFields(
				{ name: 'Category', value: `${categoryEmojis[category]} ${category}`, inline: true },
				{ name: 'Amount', value: `$${amount.toFixed(2)}`, inline: true },
				{ name: 'Period', value: period.charAt(0).toUpperCase() + period.slice(1), inline: true }
			)
			.setFooter({ text: 'Use /budget status to check your spending' })
			.setTimestamp();

		await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
	},

	async handleStatus(interaction) {
		const budgets = await budgetDB.getBudgets(
			interaction.user.id,
			interaction.guild.id
		);

		if (budgets.length === 0) {
			return await interaction.reply({
				content: '📊 You have no budgets set yet. Use `/budget set` to create one!',
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

		const budgetFields = budgets.map(budget => {
			const limit = parseFloat(budget.amount);
			const spent = parseFloat(budget.spent);
			const remaining = limit - spent;
			const percentage = limit > 0 ? (spent / limit) * 100 : 0;
			
			let color = '🟢';
			if (percentage >= 90) color = '🔴';
			else if (percentage >= 75) color = '🟡';

			const barLength = 10;
			const filledBars = Math.min(Math.round((spent / limit) * barLength), barLength);
			const emptyBars = barLength - filledBars;
			const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);

			const emoji = categoryEmojis[budget.category] || '💼';
			
			return {
				name: `${emoji} ${budget.category.charAt(0).toUpperCase() + budget.category.slice(1)} (${budget.period})`,
				value: `${color} \`${progressBar}\` ${percentage.toFixed(1)}%\n` +
					   `💰 Spent: $${spent.toFixed(2)} / $${limit.toFixed(2)}\n` +
					   `💵 Remaining: $${remaining.toFixed(2)}`,
				inline: false
			};
		});

		const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.amount), 0);
		const totalSpent = budgets.reduce((sum, b) => sum + parseFloat(b.spent), 0);
		const totalRemaining = totalBudget - totalSpent;

		const embed = new EmbedBuilder()
			.setColor(totalSpent / totalBudget >= 0.9 ? '#ff0000' : totalSpent / totalBudget >= 0.75 ? '#ffcc00' : '#00ff00')
			.setTitle('📊 Budget Status')
			.setDescription('Track your spending against your budgets')
			.addFields(budgetFields)
			.addFields(
				{ name: 'Total Budget', value: `$${totalBudget.toFixed(2)}`, inline: true },
				{ name: 'Total Spent', value: `$${totalSpent.toFixed(2)}`, inline: true },
				{ name: 'Total Remaining', value: `$${totalRemaining.toFixed(2)}`, inline: true }
			)
			.setFooter({ text: '🟢 Under 75% | 🟡 75-90% | 🔴 Over 90%' })
			.setTimestamp();

		await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
	}
};

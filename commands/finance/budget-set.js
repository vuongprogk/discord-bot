const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { budgetDB, expenseDB } = require('../../database.ts');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('budget-set')
		.setDescription('Set a monthly budget for a category (private)')
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
				.setDescription('Budget amount per month')
				.setRequired(true)
				.setMinValue(0.01)),
	async execute(interaction) {
		try {
			const category = interaction.options.getString('category');
			const amount = interaction.options.getNumber('amount');

			await budgetDB.setBudget(
				interaction.user.id,
				interaction.guild.id,
				category,
				amount,
				'monthly'
			);

			// Get current spending for this category this month
			const now = new Date();
			const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
			const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

			const expenses = await expenseDB.getExpensesByDateRange(
				interaction.user.id,
				interaction.guild.id,
				monthStart,
				monthEnd
			);

			const spent = expenses
				.filter(e => e.category === category)
				.reduce((sum, e) => sum + parseFloat(e.amount), 0);

			const remaining = amount - spent;
			const percentage = (spent / amount) * 100;

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

			const emoji = categoryEmojis[category] || '💼';
			const statusEmoji = percentage > 100 ? '🔴' : percentage > 80 ? '🟡' : '🟢';

			const embed = new EmbedBuilder()
				.setColor(percentage > 100 ? '#ff0000' : percentage > 80 ? '#ffcc00' : '#00ff00')
				.setTitle(`${statusEmoji} Budget Set for ${emoji} ${category}`)
				.addFields(
					{ name: 'Monthly Budget', value: `$${amount.toFixed(2)}`, inline: true },
					{ name: 'Spent This Month', value: `$${spent.toFixed(2)}`, inline: true },
					{ name: 'Remaining', value: `$${remaining.toFixed(2)}`, inline: true }
				)
				.setFooter({ text: `${percentage.toFixed(1)}% of budget used` })
				.setTimestamp();

			await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
		} catch (error) {
			console.error(error);
			await interaction.reply({
				content: '❌ Failed to set budget. Please try again.',
				flags: MessageFlags.Ephemeral
			});
		}
	},
};

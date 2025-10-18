const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { expenseDB } = require('../../database.ts');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('expense-summary')
		.setDescription('View your expense summary (private)')
		.addStringOption(option =>
			option.setName('period')
				.setDescription('Time period')
				.addChoices(
					{ name: 'This Month', value: 'month' },
					{ name: 'This Year', value: 'year' },
					{ name: 'All Time', value: 'all' }
				)),
	async execute(interaction) {
		try {
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
					content: '📊 No expenses found for this period. Use `/expense-add` to add one!',
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
		} catch (error) {
			console.error(error);
			await interaction.reply({
				content: '❌ Failed to generate summary. Please try again.',
				flags: MessageFlags.Ephemeral
			});
		}
	},
};

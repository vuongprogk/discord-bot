const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { expenseDB } = require('../../database.ts');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('expense-add')
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
				.setRequired(false)),
	async execute(interaction) {
		try {
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
		} catch (error) {
			console.error(error);
			await interaction.reply({ 
				content: '❌ Failed to add expense. Please try again.', 
				flags: MessageFlags.Ephemeral 
			});
		}
	},
};

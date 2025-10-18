const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { todoDB } = require('../../database.ts');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('todo-add')
		.setDescription('Add a new todo item (private)')
		.addStringOption(option =>
			option.setName('title')
				.setDescription('Todo title')
				.setRequired(true)
				.setMaxLength(255))
		.addStringOption(option =>
			option.setName('priority')
				.setDescription('Priority level')
				.addChoices(
					{ name: '🔴 High', value: 'high' },
					{ name: '🟡 Medium', value: 'medium' },
					{ name: '🟢 Low', value: 'low' }
				))
		.addStringOption(option =>
			option.setName('description')
				.setDescription('Detailed description')
				.setMaxLength(500))
		.addStringOption(option =>
			option.setName('due_date')
				.setDescription('Due date (YYYY-MM-DD or YYYY-MM-DD HH:MM)')),
	async execute(interaction) {
		try {
			const title = interaction.options.getString('title');
			const priority = interaction.options.getString('priority') || 'medium';
			const description = interaction.options.getString('description');
			const dueDateStr = interaction.options.getString('due_date');

			let dueDate = null;
			if (dueDateStr) {
				dueDate = new Date(dueDateStr);
				if (isNaN(dueDate.getTime())) {
					return await interaction.reply({
						content: '❌ Invalid date format. Use YYYY-MM-DD or YYYY-MM-DD HH:MM',
						flags: MessageFlags.Ephemeral
					});
				}
			}

			const todo = await todoDB.addTodo(
				interaction.user.id,
				interaction.guild.id,
				title,
				description,
				priority,
				dueDate
			);

			const priorityEmojis = {
				high: '🔴',
				medium: '🟡',
				low: '🟢'
			};

			const embed = new EmbedBuilder()
				.setColor(priority === 'high' ? '#ff0000' : priority === 'medium' ? '#ffcc00' : '#00ff00')
				.setTitle('✅ Todo Added')
				.addFields(
					{ name: 'Title', value: title },
					{ name: 'Priority', value: `${priorityEmojis[priority]} ${priority.toUpperCase()}`, inline: true },
					{ name: 'ID', value: `#${todo.id}`, inline: true }
				)
				.setTimestamp();

			if (description) {
				embed.addFields({ name: 'Description', value: description });
			}

			if (dueDate) {
				embed.addFields({ name: 'Due Date', value: dueDate.toLocaleString() });
			}

			await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
		} catch (error) {
			console.error(error);
			await interaction.reply({
				content: '❌ Failed to add todo. Please try again.',
				flags: MessageFlags.Ephemeral
			});
		}
	},
};

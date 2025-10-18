const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { todoDB } = require('../../database.ts');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('todo-view')
		.setDescription('View details of a specific todo (private)')
		.addIntegerOption(option =>
			option.setName('id')
				.setDescription('Todo ID to view')
				.setRequired(true)),
	async execute(interaction) {
		try {
			const id = interaction.options.getInteger('id');
			
			const todo = await todoDB.getTodoById(
				id,
				interaction.user.id,
				interaction.guild.id
			);

			if (!todo) {
				return await interaction.reply({
					content: '❌ Todo not found or you don\'t have permission to view it.',
					flags: MessageFlags.Ephemeral
				});
			}

			const priorityEmojis = {
				high: '🔴',
				medium: '🟡',
				low: '🟢'
			};

			const statusEmoji = todo.completed ? '✅' : '⬜';
			const priority = priorityEmojis[todo.priority] || '🟡';

			const embed = new EmbedBuilder()
				.setColor(todo.completed ? '#00ff00' : todo.priority === 'high' ? '#ff0000' : todo.priority === 'medium' ? '#ffcc00' : '#0099ff')
				.setTitle(`${statusEmoji} Todo #${todo.id}`)
				.addFields(
					{ name: 'Title', value: todo.title },
					{ name: 'Priority', value: `${priority} ${todo.priority.toUpperCase()}`, inline: true },
					{ name: 'Status', value: todo.completed ? '✅ Completed' : '⬜ Pending', inline: true }
				);

			if (todo.description) {
				embed.addFields({ name: 'Description', value: todo.description });
			}

			if (todo.due_date) {
				const dueDate = new Date(todo.due_date);
				const now = new Date();
				const isOverdue = !todo.completed && dueDate < now;
				embed.addFields({ 
					name: isOverdue ? '⚠️ Due Date (OVERDUE)' : '📅 Due Date', 
					value: dueDate.toLocaleString() 
				});
			}

			embed.addFields(
				{ name: 'Created', value: new Date(todo.created_at).toLocaleString(), inline: true },
				{ name: 'Updated', value: new Date(todo.updated_at).toLocaleString(), inline: true }
			);

			await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
		} catch (error) {
			console.error(error);
			await interaction.reply({
				content: '❌ Failed to fetch todo details. Please try again.',
				flags: MessageFlags.Ephemeral
			});
		}
	},
};

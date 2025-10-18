const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { todoDB } = require('../../database.ts');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('todo-list')
		.setDescription('View your todo list (private)')
		.addBooleanOption(option =>
			option.setName('show_completed')
				.setDescription('Include completed todos')),
	async execute(interaction) {
		try {
			const showCompleted = interaction.options.getBoolean('show_completed') || false;
			const todos = await todoDB.getTodos(
				interaction.user.id,
				interaction.guild.id,
				showCompleted
			);

			if (todos.length === 0) {
				return await interaction.reply({
					content: showCompleted 
						? '📋 You have no todos. Use `/todo-add` to create one!'
						: '🎉 No pending todos! Use `/todo-list show_completed:true` to see completed ones.',
					flags: MessageFlags.Ephemeral
				});
			}

			const priorityEmojis = {
				high: '🔴',
				medium: '🟡',
				low: '🟢'
			};

			const now = new Date();
			const todoList = todos.map(todo => {
				const checkbox = todo.completed ? '✅' : '⬜';
				const priority = priorityEmojis[todo.priority] || '🟡';
				const strikethrough = todo.completed ? '~~' : '';
				
				let dueDateStr = '';
				if (todo.due_date) {
					const dueDate = new Date(todo.due_date);
					const isOverdue = !todo.completed && dueDate < now;
					dueDateStr = isOverdue 
						? ` ⚠️ **OVERDUE** (${dueDate.toLocaleDateString()})`
						: ` 📅 ${dueDate.toLocaleDateString()}`;
				}

				return `${checkbox} ${priority} **#${todo.id}** ${strikethrough}${todo.title}${strikethrough}${dueDateStr}`;
			}).join('\n');

			const stats = await todoDB.getTodoStats(interaction.user.id, interaction.guild.id);

			const embed = new EmbedBuilder()
				.setColor('#0099ff')
				.setTitle('📋 Your Todo List')
				.setDescription(todoList)
				.addFields(
					{ name: 'Total', value: `${stats.total}`, inline: true },
					{ name: 'Pending', value: `${stats.pending}`, inline: true },
					{ name: 'Completed', value: `${stats.completed}`, inline: true }
				);

			if (parseInt(stats.overdue) > 0) {
				embed.addFields({ name: '⚠️ Overdue', value: `${stats.overdue}`, inline: true });
			}
			if (parseInt(stats.high_priority) > 0) {
				embed.addFields({ name: '🔴 High Priority', value: `${stats.high_priority}`, inline: true });
			}

			embed.setFooter({ text: 'Use /todo-complete <id> to mark as done' })
				.setTimestamp();

			await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
		} catch (error) {
			console.error(error);
			await interaction.reply({
				content: '❌ Failed to fetch todos. Please try again.',
				flags: MessageFlags.Ephemeral
			});
		}
	},
};

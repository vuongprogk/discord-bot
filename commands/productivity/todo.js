const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { todoDB } = require('../../database.ts');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('todo')
		.setDescription('Manage your personal todo list')
		.addSubcommand(subcommand =>
			subcommand
				.setName('add')
				.setDescription('Add a new todo item')
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
						.setDescription('Due date (YYYY-MM-DD or YYYY-MM-DD HH:MM)')))
		.addSubcommand(subcommand =>
			subcommand
				.setName('list')
				.setDescription('View your todo list')
				.addBooleanOption(option =>
					option.setName('show_completed')
						.setDescription('Include completed todos')))
		.addSubcommand(subcommand =>
			subcommand
				.setName('complete')
				.setDescription('Mark todo as complete')
				.addIntegerOption(option =>
					option.setName('id')
						.setDescription('Todo ID to complete')
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('delete')
				.setDescription('Delete a todo item')
				.addIntegerOption(option =>
					option.setName('id')
						.setDescription('Todo ID to delete')
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
				case 'complete':
					await this.handleComplete(interaction);
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
		const title = interaction.options.getString('title');
		const description = interaction.options.getString('description');
		const priority = interaction.options.getString('priority') || 'medium';
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

		const priorityEmojis = { high: '🔴', medium: '🟡', low: '🟢' };
		const embed = new EmbedBuilder()
			.setColor(priority === 'high' ? '#ff0000' : priority === 'medium' ? '#ffcc00' : '#00ff00')
			.setTitle('✅ Todo Added')
			.addFields(
				{ name: 'Title', value: title, inline: false },
				{ name: 'Priority', value: `${priorityEmojis[priority]} ${priority.toUpperCase()}`, inline: true }
			)
			.setFooter({ text: `Todo ID: ${todo.id}` })
			.setTimestamp();

		if (description) {
			embed.addFields({ name: 'Description', value: description, inline: false });
		}

		if (dueDate) {
			embed.addFields({ name: 'Due Date', value: dueDate.toLocaleString(), inline: true });
		}

		await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
	},

	async handleList(interaction) {
		const showCompleted = interaction.options.getBoolean('show_completed') || false;
		const todos = await todoDB.getTodos(interaction.user.id, interaction.guild.id, showCompleted);

		if (todos.length === 0) {
			return await interaction.reply({
				content: showCompleted 
					? '📋 You have no todos. Use `/todo add` to create one!'
					: '🎉 No pending todos! Use `/todo list show_completed:true` to see completed ones.',
				flags: MessageFlags.Ephemeral
			});
		}

		const priorityEmojis = { high: '🔴', medium: '🟡', low: '🟢' };
		
		const todoList = todos.map(todo => {
			const status = todo.completed ? '✅' : '⬜';
			const priority = priorityEmojis[todo.priority] || '⚪';
			const title = todo.completed ? `~~${todo.title}~~` : `**${todo.title}**`;
			
			let line = `${status} ${priority} ${title} [ID: ${todo.id}]`;
			
			if (todo.dueDate) {
				const dueDate = new Date(todo.dueDate);
				const isOverdue = !todo.completed && dueDate < new Date();
				const dateStr = dueDate.toLocaleDateString();
				line += isOverdue ? ` 🔥 **Overdue: ${dateStr}**` : ` 📅 ${dateStr}`;
			}
			
			return line;
		}).join('\n');

		const completedCount = todos.filter(t => t.completed).length;
		const pendingCount = todos.length - completedCount;

		const embed = new EmbedBuilder()
			.setColor('#0099ff')
			.setTitle('📋 Your Todo List')
			.setDescription(todoList)
			.addFields(
				{ name: 'Pending', value: `${pendingCount}`, inline: true },
				{ name: 'Completed', value: `${completedCount}`, inline: true },
				{ name: 'Total', value: `${todos.length}`, inline: true }
			)
			.setFooter({ text: 'Use /todo complete <id> to mark as done' })
			.setTimestamp();

		await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
	},

	async handleComplete(interaction) {
		const id = interaction.options.getInteger('id');
		const todo = await todoDB.completeTodo(id, interaction.user.id, interaction.guild.id);

		if (!todo) {
			return await interaction.reply({
				content: '❌ Todo not found or you don\'t have permission to modify it.',
				flags: MessageFlags.Ephemeral
			});
		}

		await interaction.reply({
			content: `🎉 Todo #${id} "${todo.title}" has been marked as ✅ Completed!`,
			flags: MessageFlags.Ephemeral
		});
	},

	async handleDelete(interaction) {
		const id = interaction.options.getInteger('id');
		const todo = await todoDB.deleteTodo(id, interaction.user.id, interaction.guild.id);

		if (!todo) {
			return await interaction.reply({
				content: '❌ Todo not found or you don\'t have permission to delete it.',
				flags: MessageFlags.Ephemeral
			});
		}

		await interaction.reply({
			content: `✅ Todo #${id} "${todo.title}" has been deleted successfully!`,
			flags: MessageFlags.Ephemeral
		});
	}
};

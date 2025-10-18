const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { todoDB } = require('../../database.ts');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('todo-stats')
		.setDescription('View your todo statistics (private)'),
	async execute(interaction) {
		try {
			const stats = await todoDB.getTodoStats(
				interaction.user.id,
				interaction.guild.id
			);

			if (parseInt(stats.total) === 0) {
				return await interaction.reply({
					content: '📊 You haven\'t created any todos yet. Use `/todo-add` to create one!',
					flags: MessageFlags.Ephemeral
				});
			}

			const completionRate = (parseInt(stats.completed) / parseInt(stats.total)) * 100;
			const progressBar = '█'.repeat(Math.round(completionRate / 5)) + '░'.repeat(20 - Math.round(completionRate / 5));

			const embed = new EmbedBuilder()
				.setColor('#0099ff')
				.setTitle('📊 Todo Statistics')
				.addFields(
					{ name: 'Total Todos', value: `${stats.total}`, inline: true },
					{ name: '✅ Completed', value: `${stats.completed}`, inline: true },
					{ name: '⬜ Pending', value: `${stats.pending}`, inline: true },
					{ name: 'Completion Rate', value: `\`${progressBar}\` ${completionRate.toFixed(1)}%` }
				);

			if (parseInt(stats.high_priority) > 0) {
				embed.addFields({ name: '🔴 High Priority Pending', value: `${stats.high_priority}`, inline: true });
			}

			if (parseInt(stats.overdue) > 0) {
				embed.addFields({ name: '⚠️ Overdue Tasks', value: `${stats.overdue}`, inline: true });
			}

			embed.setFooter({ text: 'Keep up the great work!' })
				.setTimestamp();

			await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
		} catch (error) {
			console.error(error);
			await interaction.reply({
				content: '❌ Failed to fetch statistics. Please try again.',
				flags: MessageFlags.Ephemeral
			});
		}
	},
};

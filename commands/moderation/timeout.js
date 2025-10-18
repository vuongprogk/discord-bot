const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('timeout')
		.setDescription('Timeout a member')
		.addUserOption(option =>
			option.setName('target')
				.setDescription('The member to timeout')
				.setRequired(true))
		.addIntegerOption(option =>
			option.setName('duration')
				.setDescription('Duration in minutes')
				.setRequired(true)
				.setMinValue(1)
				.setMaxValue(40320)) // Max 28 days
		.addStringOption(option =>
			option.setName('reason')
				.setDescription('Reason for timeout'))
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
	async execute(interaction) {
		const target = interaction.options.getUser('target');
		const duration = interaction.options.getInteger('duration');
		const reason = interaction.options.getString('reason') || 'No reason provided';
		const member = interaction.guild.members.cache.get(target.id);

		if (!member) {
			return interaction.reply({ content: '❌ User not found in this server!', ephemeral: true });
		}

		if (!member.moderatable) {
			return interaction.reply({ content: '❌ I cannot timeout this user!', ephemeral: true });
		}

		try {
			await member.timeout(duration * 60 * 1000, reason);
			await interaction.reply(`⏰ Successfully timed out ${target.tag} for ${duration} minutes\n**Reason:** ${reason}`);
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: '❌ Failed to timeout the user!', ephemeral: true });
		}
	},
};

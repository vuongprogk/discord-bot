const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('kick')
		.setDescription('Kick a member from the server')
		.addUserOption(option =>
			option.setName('target')
				.setDescription('The member to kick')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('reason')
				.setDescription('Reason for kicking'))
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
	async execute(interaction) {
		const target = interaction.options.getUser('target');
		const reason = interaction.options.getString('reason') || 'No reason provided';
		const member = interaction.guild.members.cache.get(target.id);

		if (!member) {
			return interaction.reply({ content: '❌ User not found in this server!', flags: MessageFlags.Ephemeral });
		}

		if (!member.kickable) {
			return interaction.reply({ content: '❌ I cannot kick this user!', flags: MessageFlags.Ephemeral });
		}

		try {
			await member.kick(reason);
			await interaction.reply(`👢 Successfully kicked ${target.tag}\n**Reason:** ${reason}`);
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: '❌ Failed to kick the user!', flags: MessageFlags.Ephemeral });
		}
	},
};

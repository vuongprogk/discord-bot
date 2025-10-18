const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ban')
		.setDescription('Ban a member from the server')
		.addUserOption(option =>
			option.setName('target')
				.setDescription('The member to ban')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('reason')
				.setDescription('Reason for banning'))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction) {
		const target = interaction.options.getUser('target');
		const reason = interaction.options.getString('reason') || 'No reason provided';
		const member = interaction.guild.members.cache.get(target.id);

		if (!member) {
			return interaction.reply({ content: '❌ User not found in this server!', flags: MessageFlags.Ephemeral });
		}

		if (!member.bannable) {
			return interaction.reply({ content: '❌ I cannot ban this user!', flags: MessageFlags.Ephemeral });
		}

		try {
			await member.ban({ reason });
			await interaction.reply(`🔨 Successfully banned ${target.tag}\n**Reason:** ${reason}`);
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: '❌ Failed to ban the user!', flags: MessageFlags.Ephemeral });
		}
	},
};

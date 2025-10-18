const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('clear')
		.setDescription('Clear messages from a channel')
		.addIntegerOption(option =>
			option.setName('amount')
				.setDescription('Number of messages to clear (1-100)')
				.setRequired(true)
				.setMinValue(1)
				.setMaxValue(100))
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
	async execute(interaction) {
		const amount = interaction.options.getInteger('amount');

		try {
			await interaction.channel.bulkDelete(amount, true);
			await interaction.reply({ 
				content: `🗑️ Successfully deleted ${amount} messages!`, 
				flags: MessageFlags.Ephemeral
			});
		} catch (error) {
			console.error(error);
			await interaction.reply({ 
				content: '❌ There was an error trying to clear messages in this channel!', 
				flags: MessageFlags.Ephemeral
			});
		}
	},
};

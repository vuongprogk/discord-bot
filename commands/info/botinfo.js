const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const os = require('os');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('botinfo')
		.setDescription('Get information about the bot'),
	async execute(interaction) {
		const client = interaction.client;
		const uptime = process.uptime();
		const days = Math.floor(uptime / 86400);
		const hours = Math.floor(uptime / 3600) % 24;
		const minutes = Math.floor(uptime / 60) % 60;
		const seconds = Math.floor(uptime % 60);

		const embed = new EmbedBuilder()
			.setColor('#0099ff')
			.setTitle('🤖 Bot Information')
			.setThumbnail(client.user.displayAvatarURL())
			.addFields(
				{ name: 'Bot Name', value: client.user.tag, inline: true },
				{ name: 'Bot ID', value: client.user.id, inline: true },
				{ name: 'Created', value: `<t:${Math.floor(client.user.createdTimestamp / 1000)}:R>`, inline: true },
				{ name: 'Servers', value: `${client.guilds.cache.size}`, inline: true },
				{ name: 'Users', value: `${client.users.cache.size}`, inline: true },
				{ name: 'Channels', value: `${client.channels.cache.size}`, inline: true },
				{ name: 'Uptime', value: `${days}d ${hours}h ${minutes}m ${seconds}s`, inline: true },
				{ name: 'Memory Usage', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
				{ name: 'Node.js', value: process.version, inline: true },
				{ name: 'Ping', value: `${client.ws.ping}ms`, inline: true },
				{ name: 'Runtime', value: `Bun ${process.versions.bun || 'N/A'}`, inline: true }
			)
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};

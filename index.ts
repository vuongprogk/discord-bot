import './instrumentation.ts';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client, Events, GatewayIntentBits, Collection, MessageFlags  } from 'discord.js';
import logger from './logger.ts';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Extend the Client type to include commands property
declare module 'discord.js' {
	export interface Client {
		commands: Collection<string, any>;
	}
}


logger.info('OpenTelemetry SDK started - exporting to: ' + (process.env.OTEL_ENDPOINT || ''));
logger.info('Starting Discord bot application...');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient) => {
	logger.info(`Ready! Logged in as ${readyClient.user.tag}`);
	logger.info('Bot is now online and ready to receive events');
});

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	logger.info(`Loading commands from ${commandsPath}`);
	const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			logger.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) {
		logger.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		logger.info(`Executing command: ${interaction.commandName}`, {
			user: interaction.user.tag,
			guild: interaction.guild?.name,
			channel: interaction.channel?.id,
		});
		await command.execute(interaction);
		logger.info(`Command ${interaction.commandName} executed successfully`);
	} catch (error) {
		logger.error(`Error executing command ${interaction.commandName}:`, error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({
				content: 'There was an error while executing this command!',
				flags: MessageFlags.Ephemeral,
			});
		} else {
			await interaction.reply({
				content: 'There was an error while executing this command!',
				flags: MessageFlags.Ephemeral,
			});
		}
	}
});

client.on('error', (error) => {
  logger.error('Discord client error:', error);
});

client.on('warn', (info) => {
  logger.warn('Discord client warning:', info);
});

logger.info('Attempting to login to Discord...');
client.login(process.env.DISCORD_TOKEN);

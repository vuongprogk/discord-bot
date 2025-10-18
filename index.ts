import './instrumentation.ts';

import { Client, Events, GatewayIntentBits } from 'discord.js';
import logger from './logger.ts';

logger.info('OpenTelemetry SDK started - exporting to: ' + (process.env.OTEL_ENDPOINT || ''));
logger.info('Starting Discord bot application...');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient: { user: { tag: any; }; }) => {
	logger.info(`Ready! Logged in as ${readyClient.user.tag}`);
	logger.info('Bot is now online and ready to receive events');
});


client.on('error', (error: any) => {
  logger.error('Discord client error:', error);
});

client.on('warn', (info: string) => {
  logger.warn('Discord client warning:', info);
});

logger.info('Attempting to login to Discord...');
client.login(process.env.DISCORD_TOKEN);

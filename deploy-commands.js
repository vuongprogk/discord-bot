import logger from "./logger";

import { REST, Routes } from "discord.js";
import fs from "node:fs";
import path from "node:path";

const commands = [];
// Grab all the command folders from the commands directory you created earlier
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  // Grab all the command files from the commands directory you created earlier
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
      commands.push(command.data.toJSON());
    } else {
      logger.warn(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

// Construct and prepare an instance of the REST module
const rest = new REST({ timeout: 60000 }).setToken(process.env.DISCORD_TOKEN);

// Helper function to check if two commands are equal
function commandsEqual(cmd1, cmd2) {
  return JSON.stringify(cmd1) === JSON.stringify(cmd2);
}

// Deploy commands incrementally
(async () => {
  try {
    const startTime = Date.now();
    
    logger.info(
      `🔄 Started incremental deployment for ${commands.length} local commands...`
    );

    // Fetch existing commands from Discord
    logger.info(`📥 Fetching existing commands from Discord...`);
    const existingCommands = await rest.get(
      Routes.applicationCommands(process.env.CLIENT_ID)
    );
    logger.info(`   Found ${existingCommands.length} existing commands`);

    // Create a map of existing commands by name
    const existingMap = new Map();
    for (const cmd of existingCommands) {
      existingMap.set(cmd.name, cmd);
    }

    // Track what we need to do
    const toCreate = [];
    const toUpdate = [];
    const toKeep = [];

    // Compare local commands with existing ones
    for (const localCmd of commands) {
      const existing = existingMap.get(localCmd.name);
      
      if (!existing) {
        // Command doesn't exist - need to create
        toCreate.push(localCmd);
      } else {
        // Command exists - check if it needs updating
        // Compare only the fields we defined (not id, version, etc from Discord)
        const existingData = {
          name: existing.name,
          description: existing.description,
          options: existing.options || [],
          default_member_permissions: existing.default_member_permissions,
          dm_permission: existing.dm_permission,
          nsfw: existing.nsfw,
        };
        
        if (!commandsEqual(localCmd, existingData)) {
          toUpdate.push({ id: existing.id, ...localCmd });
        } else {
          toKeep.push(localCmd.name);
        }
      }
    }

    logger.info(`\n📊 Deployment Plan:`);
    logger.info(`   ✨ Create: ${toCreate.length} new commands`);
    logger.info(`   🔄 Update: ${toUpdate.length} changed commands`);
    logger.info(`   ✓  Keep: ${toKeep.length} unchanged commands`);

    // Create new commands
    for (const cmd of toCreate) {
      logger.info(`   Creating: ${cmd.name}...`);
      await rest.post(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: cmd }
      );
    }

    // Update changed commands
    for (const cmd of toUpdate) {
      logger.info(`   Updating: ${cmd.name}...`);
      await rest.patch(
        Routes.applicationCommands(process.env.CLIENT_ID, cmd.id),
        { body: cmd }
      );
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    logger.info(
      `\n✅ Deployment completed in ${duration}s`
    );
    logger.info(
      `   Total commands: ${existingCommands.length + toCreate.length}`
    );
    
    if (toCreate.length === 0 && toUpdate.length === 0) {
      logger.info(`   💡 No changes needed - all commands are up to date!`);
    }
  } catch (error) {
    logger.error("❌ Failed to deploy commands:");
    console.error(error);
    process.exit(1);
  }
})();

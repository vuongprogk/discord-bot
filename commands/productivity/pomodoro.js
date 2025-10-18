const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

// Store active pomodoro sessions
const activeSessions = new Map();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pomodoro')
		.setDescription('Pomodoro timer for productivity')
		.addSubcommand(subcommand =>
			subcommand
				.setName('start')
				.setDescription('Start a Pomodoro session')
				.addIntegerOption(option =>
					option.setName('work_duration')
						.setDescription('Work duration in minutes (default: 25)')
						.setMinValue(1)
						.setMaxValue(120))
				.addIntegerOption(option =>
					option.setName('break_duration')
						.setDescription('Break duration in minutes (default: 5)')
						.setMinValue(1)
						.setMaxValue(30))
				.addIntegerOption(option =>
					option.setName('cycles')
						.setDescription('Number of cycles before long break (default: 4)')
						.setMinValue(1)
						.setMaxValue(10))
				.addIntegerOption(option =>
					option.setName('long_break')
						.setDescription('Long break duration in minutes (default: 15)')
						.setMinValue(5)
						.setMaxValue(60)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('stop')
				.setDescription('Stop your current Pomodoro session'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('status')
				.setDescription('Check your Pomodoro session status'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('pause')
				.setDescription('Pause your current Pomodoro session'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('resume')
				.setDescription('Resume your paused Pomodoro session')),
	
	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();

		try {
			switch (subcommand) {
				case 'start':
					await this.handleStart(interaction);
					break;
				case 'stop':
					await this.handleStop(interaction);
					break;
				case 'status':
					await this.handleStatus(interaction);
					break;
				case 'pause':
					await this.handlePause(interaction);
					break;
				case 'resume':
					await this.handleResume(interaction);
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

	async handleStart(interaction) {
		const userId = interaction.user.id;
		
		// Check if user already has an active session
		if (activeSessions.has(userId)) {
			return await interaction.reply({
				content: '⚠️ You already have an active Pomodoro session. Use `/pomodoro stop` to end it first.',
				flags: MessageFlags.Ephemeral
			});
		}

		const workDuration = interaction.options.getInteger('work_duration') || 25;
		const breakDuration = interaction.options.getInteger('break_duration') || 5;
		const cycles = interaction.options.getInteger('cycles') || 4;
		const longBreak = interaction.options.getInteger('long_break') || 15;

		const session = {
			userId,
			workDuration,
			breakDuration,
			longBreak,
			cycles,
			currentCycle: 1,
			phase: 'work', // 'work', 'break', 'long_break'
			startTime: Date.now(),
			endTime: Date.now() + (workDuration * 60 * 1000),
			paused: false,
			pausedAt: null,
			remainingTime: null
		};

		activeSessions.set(userId, session);

		// Schedule the timer
		this.scheduleTimer(interaction, session);

		const embed = new EmbedBuilder()
			.setColor('#00ff00')
			.setTitle('🍅 Pomodoro Session Started!')
			.setDescription('Focus on your work and stay productive!')
			.addFields(
				{ name: '⏱️ Work Duration', value: `${workDuration} minutes`, inline: true },
				{ name: '☕ Break Duration', value: `${breakDuration} minutes`, inline: true },
				{ name: '🔄 Cycles', value: `${cycles} before long break`, inline: true },
				{ name: '🛋️ Long Break', value: `${longBreak} minutes`, inline: true },
				{ name: '📊 Current Phase', value: `🔴 **WORK TIME** (Cycle 1/${cycles})`, inline: false },
				{ name: '⏰ Ends At', value: `<t:${Math.floor(session.endTime / 1000)}:T>`, inline: false }
			)
			.setFooter({ text: 'Use /pomodoro status to check progress | /pomodoro stop to end' })
			.setTimestamp();

		await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
	},

	async handleStop(interaction) {
		const userId = interaction.user.id;
		const session = activeSessions.get(userId);

		if (!session) {
			return await interaction.reply({
				content: '❌ You don\'t have an active Pomodoro session.',
				flags: MessageFlags.Ephemeral
			});
		}

		// Clear the timer
		if (session.timerId) {
			clearTimeout(session.timerId);
		}

		const duration = Math.floor((Date.now() - session.startTime) / 1000 / 60);
		const completedCycles = session.currentCycle - 1;

		activeSessions.delete(userId);

		const embed = new EmbedBuilder()
			.setColor('#ff0000')
			.setTitle('🛑 Pomodoro Session Stopped')
			.addFields(
				{ name: '⏱️ Total Duration', value: `${duration} minutes`, inline: true },
				{ name: '✅ Completed Cycles', value: `${completedCycles}`, inline: true },
				{ name: '📊 Phase When Stopped', value: session.phase === 'work' ? '🔴 Work' : session.phase === 'break' ? '🟢 Break' : '🟣 Long Break', inline: true }
			)
			.setFooter({ text: 'Great effort! Start a new session anytime with /pomodoro start' })
			.setTimestamp();

		await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
	},

	async handleStatus(interaction) {
		const userId = interaction.user.id;
		const session = activeSessions.get(userId);

		if (!session) {
			return await interaction.reply({
				content: '❌ You don\'t have an active Pomodoro session. Start one with `/pomodoro start`',
				flags: MessageFlags.Ephemeral
			});
		}

		const now = Date.now();
		const elapsed = Math.floor((now - session.startTime) / 1000 / 60);
		const remaining = session.paused 
			? Math.floor(session.remainingTime / 1000 / 60)
			: Math.floor((session.endTime - now) / 1000 / 60);

		const phaseEmoji = {
			work: '🔴',
			break: '🟢',
			long_break: '🟣'
		};

		const phaseName = {
			work: 'WORK TIME',
			break: 'SHORT BREAK',
			long_break: 'LONG BREAK'
		};

		const totalDuration = session.phase === 'work' 
			? session.workDuration 
			: session.phase === 'break' 
				? session.breakDuration 
				: session.longBreak;

		const progress = Math.min(Math.max(Math.floor(((totalDuration - remaining) / totalDuration) * 10), 0), 10);
		const progressBar = '█'.repeat(progress) + '░'.repeat(10 - progress);

		const embed = new EmbedBuilder()
			.setColor(session.phase === 'work' ? '#ff0000' : session.phase === 'break' ? '#00ff00' : '#9b59b6')
			.setTitle('🍅 Pomodoro Session Status')
			.setDescription(session.paused ? '⏸️ **Session is paused**' : '▶️ **Session is active**')
			.addFields(
				{ name: '📊 Current Phase', value: `${phaseEmoji[session.phase]} **${phaseName[session.phase]}**`, inline: true },
				{ name: '🔄 Cycle', value: `${session.currentCycle} / ${session.cycles}`, inline: true },
				{ name: '⏱️ Time Remaining', value: `${remaining} minutes`, inline: true },
				{ name: '📈 Progress', value: `\`${progressBar}\` ${Math.floor((totalDuration - remaining) / totalDuration * 100)}%`, inline: false }
			)
			.setFooter({ text: session.paused ? 'Use /pomodoro resume to continue' : 'Stay focused! 💪' })
			.setTimestamp();

		if (!session.paused) {
			embed.addFields({ name: '⏰ Ends At', value: `<t:${Math.floor(session.endTime / 1000)}:T>`, inline: false });
		}

		await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
	},

	async handlePause(interaction) {
		const userId = interaction.user.id;
		const session = activeSessions.get(userId);

		if (!session) {
			return await interaction.reply({
				content: '❌ You don\'t have an active Pomodoro session.',
				flags: MessageFlags.Ephemeral
			});
		}

		if (session.paused) {
			return await interaction.reply({
				content: '⚠️ Your session is already paused.',
				flags: MessageFlags.Ephemeral
			});
		}

		// Clear the current timer
		if (session.timerId) {
			clearTimeout(session.timerId);
		}

		// Save remaining time
		session.remainingTime = session.endTime - Date.now();
		session.paused = true;
		session.pausedAt = Date.now();

		await interaction.reply({
			content: '⏸️ Pomodoro session paused. Use `/pomodoro resume` to continue.',
			flags: MessageFlags.Ephemeral
		});
	},

	async handleResume(interaction) {
		const userId = interaction.user.id;
		const session = activeSessions.get(userId);

		if (!session) {
			return await interaction.reply({
				content: '❌ You don\'t have an active Pomodoro session.',
				flags: MessageFlags.Ephemeral
			});
		}

		if (!session.paused) {
			return await interaction.reply({
				content: '⚠️ Your session is not paused.',
				flags: MessageFlags.Ephemeral
			});
		}

		// Resume the timer
		session.paused = false;
		session.endTime = Date.now() + session.remainingTime;
		session.pausedAt = null;

		// Reschedule the timer
		this.scheduleTimer(interaction, session);

		await interaction.reply({
			content: '▶️ Pomodoro session resumed! Keep going! 💪',
			flags: MessageFlags.Ephemeral
		});
	},

	scheduleTimer(interaction, session) {
		const duration = session.endTime - Date.now();

		session.timerId = setTimeout(async () => {
			try {
				// Don't notify if paused
				if (session.paused) return;

				const user = await interaction.client.users.fetch(session.userId);
				
				if (session.phase === 'work') {
					// Work session ended
					const isLongBreak = session.currentCycle >= session.cycles;
					
					if (isLongBreak) {
						// Time for long break
						session.phase = 'long_break';
						session.endTime = Date.now() + (session.longBreak * 60 * 1000);
						
						await user.send({
							content: `🎉 **Cycle ${session.currentCycle} completed!**\n\n🟣 Time for a **LONG BREAK** (${session.longBreak} minutes)\nYou've earned it! Take a good rest! 🛋️`
						}).catch(() => console.log('Could not send DM to user'));
						
					} else {
						// Short break
						session.phase = 'break';
						session.endTime = Date.now() + (session.breakDuration * 60 * 1000);
						
						await user.send({
							content: `✅ **Work session completed!**\n\n🟢 Time for a **SHORT BREAK** (${session.breakDuration} minutes)\nRelax and recharge! ☕`
						}).catch(() => console.log('Could not send DM to user'));
					}
					
					this.scheduleTimer(interaction, session);
					
				} else if (session.phase === 'break') {
					// Break ended, start next work session
					session.currentCycle++;
					session.phase = 'work';
					session.endTime = Date.now() + (session.workDuration * 60 * 1000);
					
					await user.send({
						content: `⏰ **Break time is over!**\n\n🔴 Time to **WORK** (${session.workDuration} minutes)\nCycle ${session.currentCycle}/${session.cycles} - Let's go! 💪`
					}).catch(() => console.log('Could not send DM to user'));
					
					this.scheduleTimer(interaction, session);
					
				} else if (session.phase === 'long_break') {
					// Long break ended, reset cycles
					session.currentCycle = 1;
					session.phase = 'work';
					session.endTime = Date.now() + (session.workDuration * 60 * 1000);
					
					await user.send({
						content: `🎯 **Long break is over!**\n\n🔴 Starting **NEW CYCLE** (${session.workDuration} minutes)\nFully recharged! Let's be productive! 🚀`
					}).catch(() => console.log('Could not send DM to user'));
					
					this.scheduleTimer(interaction, session);
				}
				
			} catch (error) {
				console.error('Error in Pomodoro timer:', error);
			}
		}, duration);
	}
};

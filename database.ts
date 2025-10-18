import { PrismaClient } from '@prisma/client';
import logger from './logger';

// Initialize Prisma Client with logging
const prisma = new PrismaClient({
	log: [
		{ level: 'query', emit: 'event' },
		{ level: 'error', emit: 'event' },
		{ level: 'warn', emit: 'event' },
	],
});

// Log Prisma events
prisma.$on('query', (e: any) => {
	logger.debug(`Prisma Query: ${e.query}`, { duration: e.duration, params: e.params });
});

prisma.$on('error', (e: any) => {
	logger.error(`Prisma Error: ${e.message}`, { target: e.target });
});

prisma.$on('warn', (e: any) => {
	logger.warn(`Prisma Warning: ${e.message}`, { target: e.target });
});

// Initialize database connection
export async function initDatabase() {
	try {
		await prisma.$connect();
		logger.info('Prisma connected to database successfully');
		
		// Test connection
		await prisma.$queryRaw`SELECT 1`;
		logger.info('Database connection verified');
	} catch (error) {
		logger.error('Failed to connect to database:', error);
		throw error;
	}
}

// Graceful shutdown
export async function disconnectDatabase() {
	try {
		await prisma.$disconnect();
		logger.info('Prisma disconnected from database');
	} catch (error) {
		logger.error('Error disconnecting from database:', error);
	}
}

// Expense operations
export const expenseDB = {
	// Add a new expense
	async addExpense(userId: string, guildId: string, amount: number, category: string, description: string) {
		return await prisma.expense.create({
			data: {
				userId,
				guildId,
				amount,
				category,
				description,
			},
		});
	},

	// Get user's expenses
	async getExpenses(userId: string, guildId: string, limit = 10) {
		return await prisma.expense.findMany({
			where: {
				userId,
				guildId,
			},
			orderBy: {
				createdAt: 'desc',
			},
			take: limit,
		});
	},

	// Get expenses by category
	async getExpensesByCategory(userId: string, guildId: string, category: string) {
		return await prisma.expense.findMany({
			where: {
				userId,
				guildId,
				category,
			},
			orderBy: {
				createdAt: 'desc',
			},
		});
	},

	// Get expenses by date range
	async getExpensesByDateRange(userId: string, guildId: string, startDate: Date, endDate: Date) {
		return await prisma.expense.findMany({
			where: {
				userId,
				guildId,
				createdAt: {
					gte: startDate,
					lte: endDate,
				},
			},
			orderBy: {
				createdAt: 'desc',
			},
		});
	},

	// Get total expenses
	async getTotalExpenses(userId: string, guildId: string, startDate?: Date, endDate?: Date) {
		const result = await prisma.expense.aggregate({
			where: {
				userId,
				guildId,
				...(startDate && endDate ? {
					createdAt: {
						gte: startDate,
						lte: endDate,
					},
				} : {}),
			},
			_sum: {
				amount: true,
			},
		});
		return Number(result._sum.amount || 0);
	},

	// Get category summary
	async getCategorySummary(userId: string, guildId: string, startDate: Date, endDate: Date) {
		const expenses = await prisma.expense.groupBy({
			by: ['category'],
			where: {
				userId,
				guildId,
				createdAt: {
					gte: startDate,
					lte: endDate,
				},
			},
			_sum: {
				amount: true,
			},
			_count: {
				id: true,
			},
		});

		return expenses.map((e: any) => ({
			category: e.category,
			total: Number(e._sum.amount || 0),
			count: e._count.id,
		}));
	},

	// Delete an expense
	async deleteExpense(id: number, userId: string, guildId: string) {
		try {
			return await prisma.expense.delete({
				where: {
					id,
					userId,
					guildId,
				},
			});
		} catch (error) {
			return null;
		}
	},

	// Get monthly total
	async getMonthlyTotal(userId: string, guildId: string, year: number, month: number) {
		const startDate = new Date(year, month - 1, 1);
		const endDate = new Date(year, month, 0, 23, 59, 59);

		return await this.getTotalExpenses(userId, guildId, startDate, endDate);
	},
};

// Budget operations
export const budgetDB = {
	// Set or update a budget
	async setBudget(userId: string, guildId: string, category: string, amount: number, period: string) {
		return await prisma.budget.upsert({
			where: {
				budgets_user_guild_category_period_unique: {
					userId,
					guildId,
					category,
					period,
				},
			},
			update: {
				amount,
			},
			create: {
				userId,
				guildId,
				category,
				amount,
				period,
			},
		});
	},

	// Get budgets
	async getBudgets(userId: string, guildId: string) {
		return await prisma.budget.findMany({
			where: {
				userId,
				guildId,
			},
		});
	},

	// Delete a budget
	async deleteBudget(userId: string, guildId: string, category: string) {
		try {
			return await prisma.budget.delete({
				where: {
					budgets_user_guild_category_period_unique: {
						userId,
						guildId,
						category,
						period: 'monthly',
					},
				},
			});
		} catch (error) {
			return null;
		}
	},

	// Check budget status
	async checkBudgetStatus(userId: string, guildId: string, category: string, period = 'monthly') {
		const budget = await prisma.budget.findUnique({
			where: {
				budgets_user_guild_category_period_unique: {
					userId,
					guildId,
					category,
					period,
				},
			},
		});

		if (!budget) return null;

		const now = new Date();
		const year = now.getFullYear();
		const month = now.getMonth() + 1;

		const spent = await expenseDB.getMonthlyTotal(userId, guildId, year, month);
		const budgetAmount = Number(budget.amount);

		return {
			budget: budgetAmount,
			spent,
			remaining: budgetAmount - spent,
			percentage: (spent / budgetAmount) * 100,
		};
	},
};

// Todo operations
export const todoDB = {
	// Add a new todo
	async addTodo(userId: string, guildId: string, title: string, description: string | null, priority: string, dueDate: Date | null) {
		return await prisma.todo.create({
			data: {
				userId,
				guildId,
				title,
				description,
				priority,
				dueDate,
			},
		});
	},

	// Get user's todos
	async getTodos(userId: string, guildId: string, includeCompleted = false) {
		return await prisma.todo.findMany({
			where: {
				userId,
				guildId,
				...(includeCompleted ? {} : { completed: false }),
			},
			orderBy: [
				{
					priority: 'asc', // This will need custom logic for high/medium/low
				},
				{
					dueDate: 'asc',
				},
				{
					createdAt: 'desc',
				},
			],
		});
	},

	// Get a specific todo
	async getTodoById(id: number, userId: string, guildId: string) {
		return await prisma.todo.findFirst({
			where: {
				id,
				userId,
				guildId,
			},
		});
	},

	// Update todo completion status
	async toggleTodo(id: number, userId: string, guildId: string) {
		const todo = await this.getTodoById(id, userId, guildId);
		if (!todo) return null;

		return await prisma.todo.update({
			where: {
				id,
			},
			data: {
				completed: !todo.completed,
			},
		});
	},

	// Update todo details
	async updateTodo(id: number, userId: string, guildId: string, updates: { title?: string; description?: string; priority?: string; dueDate?: Date | null }) {
		try {
			return await prisma.todo.update({
				where: {
					id,
				},
				data: updates,
			});
		} catch (error) {
			return null;
		}
	},

	// Delete a todo
	async deleteTodo(id: number, userId: string, guildId: string) {
		try {
			return await prisma.todo.delete({
				where: {
					id,
				},
			});
		} catch (error) {
			return null;
		}
	},

	// Get todo statistics
	async getTodoStats(userId: string, guildId: string) {
		const now = new Date();

		const [total, completed, pending, highPriority, overdue] = await Promise.all([
			prisma.todo.count({
				where: { userId, guildId },
			}),
			prisma.todo.count({
				where: { userId, guildId, completed: true },
			}),
			prisma.todo.count({
				where: { userId, guildId, completed: false },
			}),
			prisma.todo.count({
				where: { userId, guildId, completed: false, priority: 'high' },
			}),
			prisma.todo.count({
				where: {
					userId,
					guildId,
					completed: false,
					dueDate: {
						lt: now,
					},
				},
			}),
		]);

		return {
			total: total.toString(),
			completed: completed.toString(),
			pending: pending.toString(),
			high_priority: highPriority.toString(),
			overdue: overdue.toString(),
		};
	},

	// Clear completed todos
	async clearCompleted(userId: string, guildId: string) {
		const result = await prisma.todo.deleteMany({
			where: {
				userId,
				guildId,
				completed: true,
			},
		});

		// Return array of deleted todos (Prisma doesn't return them, so we fake it for compatibility)
		return Array(result.count).fill({ id: 0 });
	},
};

export { prisma };
export default prisma;

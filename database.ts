import { Pool } from 'pg';
import logger from './logger';

// PostgreSQL connection pool
const pool = new Pool({
	host: process.env.DB_HOST || 'localhost',
	port: parseInt(process.env.DB_PORT || '5432'),
	database: process.env.DB_NAME || 'discord_bot',
	user: process.env.DB_USER || 'postgres',
	password: process.env.DB_PASSWORD,
	max: 20,
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 2000,
});

// Initialize database tables
export async function initDatabase() {
	try {
		await pool.query(`
			CREATE TABLE IF NOT EXISTS expenses (
				id SERIAL PRIMARY KEY,
				user_id VARCHAR(255) NOT NULL,
				guild_id VARCHAR(255) NOT NULL,
				amount DECIMAL(10, 2) NOT NULL,
				category VARCHAR(100) NOT NULL,
				description TEXT,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			);
		`);

		await pool.query(`
			CREATE INDEX IF NOT EXISTS idx_expenses_user_guild 
			ON expenses(user_id, guild_id);
		`);

		await pool.query(`
			CREATE INDEX IF NOT EXISTS idx_expenses_created_at 
			ON expenses(created_at DESC);
		`);

		await pool.query(`
			CREATE TABLE IF NOT EXISTS budgets (
				id SERIAL PRIMARY KEY,
				user_id VARCHAR(255) NOT NULL,
				guild_id VARCHAR(255) NOT NULL,
				category VARCHAR(100) NOT NULL,
				amount DECIMAL(10, 2) NOT NULL,
				period VARCHAR(20) DEFAULT 'monthly',
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				UNIQUE(user_id, guild_id, category, period)
			);
		`);

		logger.info('Database initialized successfully');
	} catch (error) {
		logger.error('Failed to initialize database:', error);
		throw error;
	}
}

// Expense operations
export const expenseDB = {
	// Add a new expense
	async addExpense(userId: string, guildId: string, amount: number, category: string, description: string) {
		const result = await pool.query(
			`INSERT INTO expenses (user_id, guild_id, amount, category, description) 
			 VALUES ($1, $2, $3, $4, $5) 
			 RETURNING *`,
			[userId, guildId, amount, category, description]
		);
		return result.rows[0];
	},

	// Get user's expenses
	async getExpenses(userId: string, guildId: string, limit = 10) {
		const result = await pool.query(
			`SELECT * FROM expenses 
			 WHERE user_id = $1 AND guild_id = $2 
			 ORDER BY created_at DESC 
			 LIMIT $3`,
			[userId, guildId, limit]
		);
		return result.rows;
	},

	// Get expenses by category
	async getExpensesByCategory(userId: string, guildId: string, category: string, limit = 10) {
		const result = await pool.query(
			`SELECT * FROM expenses 
			 WHERE user_id = $1 AND guild_id = $2 AND category = $3 
			 ORDER BY created_at DESC 
			 LIMIT $4`,
			[userId, guildId, category, limit]
		);
		return result.rows;
	},

	// Get expenses for a date range
	async getExpensesByDateRange(userId: string, guildId: string, startDate: Date, endDate: Date) {
		const result = await pool.query(
			`SELECT * FROM expenses 
			 WHERE user_id = $1 AND guild_id = $2 
			 AND created_at BETWEEN $3 AND $4 
			 ORDER BY created_at DESC`,
			[userId, guildId, startDate, endDate]
		);
		return result.rows;
	},

	// Get total expenses
	async getTotalExpenses(userId: string, guildId: string) {
		const result = await pool.query(
			`SELECT SUM(amount) as total FROM expenses 
			 WHERE user_id = $1 AND guild_id = $2`,
			[userId, guildId]
		);
		return parseFloat(result.rows[0]?.total || '0');
	},

	// Get expenses by category summary
	async getCategorySummary(userId: string, guildId: string, startDate?: Date, endDate?: Date) {
		let query = `
			SELECT category, SUM(amount) as total, COUNT(*) as count 
			FROM expenses 
			WHERE user_id = $1 AND guild_id = $2
		`;
		const params: any[] = [userId, guildId];

		if (startDate && endDate) {
			query += ` AND created_at BETWEEN $3 AND $4`;
			params.push(startDate, endDate);
		}

		query += ` GROUP BY category ORDER BY total DESC`;

		const result = await pool.query(query, params);
		return result.rows;
	},

	// Delete an expense
	async deleteExpense(id: number, userId: string, guildId: string) {
		const result = await pool.query(
			`DELETE FROM expenses 
			 WHERE id = $1 AND user_id = $2 AND guild_id = $3 
			 RETURNING *`,
			[id, userId, guildId]
		);
		return result.rows[0];
	},

	// Get monthly total
	async getMonthlyTotal(userId: string, guildId: string, year: number, month: number) {
		const result = await pool.query(
			`SELECT SUM(amount) as total FROM expenses 
			 WHERE user_id = $1 AND guild_id = $2 
			 AND EXTRACT(YEAR FROM created_at) = $3 
			 AND EXTRACT(MONTH FROM created_at) = $4`,
			[userId, guildId, year, month]
		);
		return parseFloat(result.rows[0]?.total || '0');
	},
};

// Budget operations
export const budgetDB = {
	// Set a budget
	async setBudget(userId: string, guildId: string, category: string, amount: number, period = 'monthly') {
		const result = await pool.query(
			`INSERT INTO budgets (user_id, guild_id, category, amount, period) 
			 VALUES ($1, $2, $3, $4, $5) 
			 ON CONFLICT (user_id, guild_id, category, period) 
			 DO UPDATE SET amount = $4 
			 RETURNING *`,
			[userId, guildId, category, amount, period]
		);
		return result.rows[0];
	},

	// Get budgets
	async getBudgets(userId: string, guildId: string) {
		const result = await pool.query(
			`SELECT * FROM budgets 
			 WHERE user_id = $1 AND guild_id = $2`,
			[userId, guildId]
		);
		return result.rows;
	},

	// Delete a budget
	async deleteBudget(userId: string, guildId: string, category: string) {
		const result = await pool.query(
			`DELETE FROM budgets 
			 WHERE user_id = $1 AND guild_id = $2 AND category = $3 
			 RETURNING *`,
			[userId, guildId, category]
		);
		return result.rows[0];
	},

	// Check budget status
	async checkBudgetStatus(userId: string, guildId: string, category: string, period = 'monthly') {
		const budget = await pool.query(
			`SELECT amount FROM budgets 
			 WHERE user_id = $1 AND guild_id = $2 AND category = $3 AND period = $4`,
			[userId, guildId, category, period]
		);

		if (budget.rows.length === 0) return null;

		const now = new Date();
		const year = now.getFullYear();
		const month = now.getMonth() + 1;

		const spent = await expenseDB.getMonthlyTotal(userId, guildId, year, month);
		const budgetAmount = parseFloat(budget.rows[0].amount);

		return {
			budget: budgetAmount,
			spent,
			remaining: budgetAmount - spent,
			percentage: (spent / budgetAmount) * 100,
		};
	},
};

export default pool;

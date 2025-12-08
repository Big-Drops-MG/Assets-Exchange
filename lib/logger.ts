import boxen from "boxen";
import { consola } from "consola";
import ora, { type Ora } from "ora";

if (process.env.NODE_ENV === "development") {
  consola.level = 4;
}

export const logger = {
  app: consola.withTag("app"),
  api: consola.withTag("api"),
  db: consola.withTag("db"),
  auth: consola.withTag("auth"),
  rpc: consola.withTag("rpc"),
};

export default logger.app;

/**
 * Create a beautiful boxed message
 */
export function boxMessage(
  message: string,
  options?: {
    title?: string;
    color?: "green" | "red" | "yellow" | "blue" | "magenta" | "cyan";
    padding?: number;
    margin?: number;
  }
) {
  const { title, color = "blue", padding = 1, margin = 1 } = options || {};

  const content = title ? `${title}\n\n${message}` : message;

  const boxenOptions = {
    padding,
    margin,
    borderStyle: "round" as const,
    borderColor: color,
    titleAlignment: title ? ("center" as const) : undefined,
  };

  return boxen(content, boxenOptions);
}

/**
 * Create a spinner for async operations
 */
export function createSpinner(text: string): Ora {
  return ora(text);
}

/**
 * Execute an async operation with a spinner
 */
export async function withSpinner<T>(
  text: string,
  operation: () => Promise<T>,
  successText?: string,
  failText?: string
): Promise<T> {
  const spinner = ora(text).start();

  try {
    const result = await operation();
    spinner.succeed(successText || text);
    return result;
  } catch (error) {
    spinner.fail(failText || text);
    throw error;
  }
}

/**
 * Beautiful terminal logging with Consola, Boxen, and Ora
 *
 * Usage examples:
 *
 * // Basic logging
 * logger.app.info('Application started');
 * logger.app.success('Operation completed');
 * logger.app.warn('Warning message');
 * logger.app.error('Error occurred', error);
 * logger.app.debug('Debug information', { data: {...} });
 *
 * // Boxed messages for important announcements
 * console.log(boxMessage('🚀 Server started successfully!', {
 *   title: 'Success',
 *   color: 'green',
 *   padding: 1,
 *   margin: 1
 * }));
 *
 * console.log(boxMessage('⚠️  Warning: Rate limit approaching', {
 *   title: 'Warning',
 *   color: 'yellow'
 * }));
 *
 * // Spinners for async operations
 * const spinner = createSpinner('Processing data...');
 * spinner.start();
 * // ... do work
 * spinner.succeed('Data processed successfully!');
 * // or
 * spinner.fail('Failed to process data');
 *
 * // With spinner helper
 * await withSpinner(
 *   'Seeding database...',
 *   async () => {
 *     await seedDatabase();
 *   },
 *   'Database seeded successfully!',
 *   'Failed to seed database'
 * );
 *
 * // In API routes
 * logger.api.info('Request received', { path: '/api/users' });
 * logger.api.success('Request processed', { duration: '120ms' });
 *
 * // In database operations
 * logger.db.info('Connecting to database');
 * logger.db.success('Query executed', { rows: 10 });
 *
 * // In authentication
 * logger.auth.info('User login attempt', { email });
 * logger.auth.success('Login successful', { userId });
 *
 * // In RPC handlers
 * logger.rpc.info('RPC call received', { procedure: 'health' });
 * logger.rpc.success('RPC call completed');
 */

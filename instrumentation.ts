import { logger, boxMessage } from "./lib/logger";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const env = process.env.NODE_ENV || "development";
    const port = process.env.PORT || "3000";

    logger.app.info("Server instrumentation loaded");

    // Show beautiful startup message after Next.js is ready
    // Using setImmediate to ensure it runs after Next.js initialization
    setImmediate(() => {
      setTimeout(() => {
        const startupBox = boxMessage(
          `🚀 Assets Exchange\n\n` +
            `Environment: ${env}\n` +
            `Port: ${port}\n` +
            `Framework: Next.js 15.5.7\n` +
            `Build Tool: Turbopack\n\n` +
            `Local:    http://localhost:${port}\n` +
            `Network:  http://192.168.1.2:${port}`,
          {
            title: "✨ Development Server",
            color: "cyan",
            padding: 1,
            margin: 1,
          }
        );

        logger.app.info("\n" + startupBox);
        logger.app.success("Server ready!");
        logger.app.info("Happy coding! 🎉\n");
      }, 2000);
    });
  }
}

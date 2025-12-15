import picocolors from "picocolors";

/**
 * Logger utility for colored console output
 */
export class Logger {
  /**
   * Log an info message in cyan
   */
  static info(message: string): void {
    console.log(picocolors.cyan(`ℹ ${message}`));
  }

  /**
   * Log a success message in green
   */
  static success(message: string): void {
    console.log(picocolors.green(`✓ ${message}`));
  }

  /**
   * Log a warning message in yellow
   */
  static warn(message: string): void {
    console.log(picocolors.yellow(`⚠ ${message}`));
  }

  /**
   * Log an error message in red
   */
  static error(message: string): void {
    console.log(picocolors.red(`✗ ${message}`));
  }

  /**
   * Log a step message in blue
   */
  static step(message: string): void {
    console.log(picocolors.blue(`→ ${message}`));
  }

  /**
   * Log a verbose/debug message in gray
   */
  static debug(message: string): void {
    console.log(picocolors.gray(`  ${message}`));
  }

  /**
   * Log a highlighted message in magenta
   */
  static highlight(message: string): void {
    console.log(picocolors.magenta(`★ ${message}`));
  }

  /**
   * Create a formatted section header
   */
  static section(title: string): void {
    console.log("");
    console.log(picocolors.bold(picocolors.cyan(`${"=".repeat(60)}`)));
    console.log(picocolors.bold(picocolors.cyan(`  ${title}`)));
    console.log(picocolors.bold(picocolors.cyan(`${"=".repeat(60)}`)));
    console.log("");
  }
}

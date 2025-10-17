type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  includeTimestamp: boolean;
  includeCaller: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private config: LoggerConfig;

  constructor(config?: Partial<LoggerConfig>) {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    this.config = {
      enabled: config?.enabled ?? isDevelopment,
      level: config?.level ?? (isDevelopment ? 'debug' : 'warn'),
      includeTimestamp: config?.includeTimestamp ?? true,
      includeCaller: config?.includeCaller ?? isDevelopment,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const parts: string[] = [];

    if (this.config.includeTimestamp) {
      const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
      parts.push(`[${timestamp}]`);
    }

    parts.push(`[${level.toUpperCase()}]`);
    parts.push(message);

    return parts.join(' ');
  }

  private getEmoji(level: LogLevel): string {
    const emojis: Record<LogLevel, string> = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    };
    return emojis[level];
  }

  debug(message: string, ...args: any[]): void {
    if (!this.shouldLog('debug')) return;
    const emoji = this.getEmoji('debug');
    console.log(`${emoji} ${this.formatMessage('debug', message)}`, ...args);
  }

  info(message: string, ...args: any[]): void {
    if (!this.shouldLog('info')) return;
    const emoji = this.getEmoji('info');
    console.log(`${emoji} ${this.formatMessage('info', message)}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    if (!this.shouldLog('warn')) return;
    const emoji = this.getEmoji('warn');
    console.warn(`${emoji} ${this.formatMessage('warn', message)}`, ...args);
  }

  error(message: string, error?: any, ...args: any[]): void {
    if (!this.shouldLog('error')) return;
    const emoji = this.getEmoji('error');
    console.error(`${emoji} ${this.formatMessage('error', message)}`, error, ...args);
  }

  group(label: string): void {
    if (!this.config.enabled) return;
    console.group(label);
  }

  groupEnd(): void {
    if (!this.config.enabled) return;
    console.groupEnd();
  }

  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export const logger = new Logger();

export default logger;

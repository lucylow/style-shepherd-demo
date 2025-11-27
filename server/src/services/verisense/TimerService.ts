/**
 * Verisense Timer Service
 * 
 * Provides timer functionality for Nucleus applications.
 * In Verisense, developers can set timers within a Nucleus to trigger
 * events or operations at scheduled intervals, enhancing application
 * functionality and automation.
 * 
 * This service abstracts timer operations and can be used for:
 * - Scheduled tasks
 * - Periodic data synchronization
 * - Automated workflows
 * - Cleanup operations
 */

export interface TimerConfig {
  /** Unique timer identifier */
  id: string;
  /** Timer name/description */
  name?: string;
  /** Delay in milliseconds before first execution */
  delay?: number;
  /** Interval in milliseconds between executions */
  interval: number;
  /** Whether to repeat (false = one-time execution) */
  repeat: boolean;
  /** Maximum number of executions (for repeat timers) */
  maxExecutions?: number;
  /** Timer callback function */
  callback: () => Promise<void> | void;
  /** Metadata for the timer */
  metadata?: Record<string, any>;
}

export interface TimerStatus {
  id: string;
  name?: string;
  isActive: boolean;
  nextExecution?: number;
  executionCount: number;
  lastExecution?: number;
  createdAt: number;
}

export class TimerService {
  private timers: Map<string, TimerConfig & { nodeTimer?: NodeJS.Timeout }> =
    new Map();
  private executionCounts: Map<string, number> = new Map();
  private lastExecutions: Map<string, number> = new Map();

  /**
   * Create and start a timer
   * @param config - Timer configuration
   */
  async createTimer(config: TimerConfig): Promise<string> {
    const timerId = config.id;

    // Cancel existing timer if it exists
    if (this.timers.has(timerId)) {
      await this.cancelTimer(timerId);
    }

    // Initialize execution tracking
    this.executionCounts.set(timerId, 0);
    this.lastExecutions.set(timerId, 0);

    // Create timer function
    const executeTimer = async () => {
      const timer = this.timers.get(timerId);
      if (!timer) {
        return;
      }

      const executionCount = (this.executionCounts.get(timerId) || 0) + 1;
      this.executionCounts.set(timerId, executionCount);
      this.lastExecutions.set(timerId, Date.now());

      try {
        // Execute callback
        await timer.callback();
      } catch (error) {
        console.error(`Timer ${timerId} callback error:`, error);
      }

      // Check if we should continue
      if (timer.repeat) {
        if (
          timer.maxExecutions &&
          executionCount >= timer.maxExecutions
        ) {
          // Max executions reached, cancel timer
          await this.cancelTimer(timerId);
        }
      } else {
        // One-time timer, cancel after execution
        await this.cancelTimer(timerId);
      }
    };

    // Store timer config
    this.timers.set(timerId, config);

    // Schedule timer
    if (config.delay && config.delay > 0) {
      // Delayed start
      const nodeTimer = setTimeout(async () => {
        await executeTimer();

        if (config.repeat) {
          // Set up interval for repeating timer
          const intervalTimer = setInterval(async () => {
            await executeTimer();
          }, config.interval);

          // Update stored timer with interval reference
          const storedTimer = this.timers.get(timerId);
          if (storedTimer) {
            storedTimer.nodeTimer = intervalTimer as any;
          }
        }
      }, config.delay);

      // Update stored timer with timeout reference
      const storedTimer = this.timers.get(timerId);
      if (storedTimer) {
        storedTimer.nodeTimer = nodeTimer as any;
      }
    } else {
      // Immediate start
      if (config.repeat) {
        const nodeTimer = setInterval(async () => {
          await executeTimer();
        }, config.interval);

        // Update stored timer with interval reference
        const storedTimer = this.timers.get(timerId);
        if (storedTimer) {
          storedTimer.nodeTimer = nodeTimer as any;
        }
      } else {
        // One-time immediate execution
        setTimeout(async () => {
          await executeTimer();
        }, 0);
      }
    }

    return timerId;
  }

  /**
   * Cancel a timer
   * @param timerId - Timer identifier
   */
  async cancelTimer(timerId: string): Promise<boolean> {
    const timer = this.timers.get(timerId);
    if (!timer) {
      return false;
    }

    if (timer.nodeTimer) {
      if (timer.repeat) {
        clearInterval(timer.nodeTimer as any);
      } else {
        clearTimeout(timer.nodeTimer as any);
      }
    }

    this.timers.delete(timerId);
    return true;
  }

  /**
   * Get timer status
   * @param timerId - Timer identifier
   */
  getTimerStatus(timerId: string): TimerStatus | null {
    const timer = this.timers.get(timerId);
    if (!timer) {
      return null;
    }

    const executionCount = this.executionCounts.get(timerId) || 0;
    const lastExecution = this.lastExecutions.get(timerId);

    // Calculate next execution time
    let nextExecution: number | undefined;
    if (timer.repeat && lastExecution) {
      nextExecution = lastExecution + timer.interval;
    } else if (timer.delay) {
      nextExecution = Date.now() + timer.delay;
    }

    return {
      id: timerId,
      name: timer.name,
      isActive: true,
      nextExecution,
      executionCount,
      lastExecution,
      createdAt: Date.now(), // Would be actual creation time in production
    };
  }

  /**
   * Get all active timers
   */
  getAllTimers(): TimerStatus[] {
    const statuses: TimerStatus[] = [];

    for (const timerId of this.timers.keys()) {
      const status = this.getTimerStatus(timerId);
      if (status) {
        statuses.push(status);
      }
    }

    return statuses;
  }

  /**
   * Cancel all timers
   */
  async cancelAllTimers(): Promise<number> {
    let cancelled = 0;

    for (const timerId of this.timers.keys()) {
      if (await this.cancelTimer(timerId)) {
        cancelled++;
      }
    }

    return cancelled;
  }

  /**
   * Update timer configuration
   * @param timerId - Timer identifier
   * @param updates - Partial timer configuration updates
   */
  async updateTimer(
    timerId: string,
    updates: Partial<Omit<TimerConfig, 'id' | 'callback'>>
  ): Promise<boolean> {
    const timer = this.timers.get(timerId);
    if (!timer) {
      return false;
    }

    // Cancel existing timer
    await this.cancelTimer(timerId);

    // Create new timer with updated config
    const updatedConfig: TimerConfig = {
      ...timer,
      ...updates,
    };

    await this.createTimer(updatedConfig);
    return true;
  }
}


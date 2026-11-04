/**
 * When a capture page counts as stalled: it holds a frame (and the machine's generation slot) while
 * its main thread does no work.
 *
 * The page generates a person on its main thread, with no worker, so a frame in progress either
 * runs main-thread tasks or waits on something that never settles (a request the server never
 * answers, a promise nobody resolves). Chrome's own `Performance.getMetrics` reports `TaskDuration`,
 * the seconds of main-thread task time so far; a busy page answers that call only between its long
 * tasks, so a busy page never reads idle. A frame whose page added less than {@link LEAST} seconds of
 * task time over the last {@link WINDOW} milliseconds is stalled; on 2026-11-04 two frames held the
 * slot for over ten minutes that way, with no process computing, until the session was restarted.
 */
export namespace HumanDebugStall {
  /** One reading of the page's main-thread work. */
  export interface ISample {
    /** Milliseconds on the server's clock. */
    at: number;

    /** The page's `TaskDuration`, seconds of main-thread task time so far. */
    work: number;
  }

  /** Milliseconds without main-thread work after which a frame counts as stalled: past any network wait the page makes. */
  export const WINDOW: number = 60_000;

  /** Seconds of task time within the window that count as work: a few idle timers and frames stay under it. */
  export const LEAST: number = 0.05;

  /** Milliseconds between readings. */
  export const EVERY: number = 5_000;

  /**
   * Whether the readings show a stall: they span the window and the work grew by less than
   * {@link LEAST} over its last stretch.
   *
   * @param samples Readings in time order.
   * @returns True when the page did no work over the last window.
   */
  export function stalled(samples: readonly ISample[]): boolean {
    const last: ISample | undefined = samples[samples.length - 1];
    if (last === undefined) return false;

    // The latest reading at least a window before the last one is the window's start.
    let start: ISample | undefined;
    for (const s of samples) if (last.at - s.at >= WINDOW) start = s;

    return start !== undefined && last.work - start.work < LEAST;
  }
}

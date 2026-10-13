/**
 * The queue's admission limits and its clock.
 *
 * @author Samchon
 */
export interface ICreateHumanViewerQueueProps {
  /** Requests allowed to wait in one lane before a new one is refused. */
  limit: number;

  /** Consecutive `ui` starts after which a waiting `cli` request goes next. */
  patience: number;

  /** Monotonic clock in milliseconds. */
  now: () => number;

  /**
   * Quiet period before a bulk request may start, in milliseconds; zero or absent means none.
   */
  quietMs?: number;

  /** Runs a callback after a delay; defaults to `setTimeout`. */
  later?: (run: () => void, ms: number) => void;
}

/**
 * The queue's admission limits and its clock.
 *
 * @evidence contracts/common.md#clear-and-simple-design Limits and time sources are explicit inputs, so the policy has no hidden state.
 * @evidence contracts/common.md#meaningful-documentation Names each limit and its unit.
 * @author Samchon
 */
export interface ICreateHumanViewerQueueProps {
  /** Requests allowed to wait in one lane before a new one is refused. */
  limit: number;

  /** Consecutive `ui` starts after which a waiting `cli` request goes next. */
  patience: number;

  /** Monotonic clock in milliseconds. */
  now: () => number;

  /** Quiet period before a bulk request may start, in milliseconds; zero or absent means none. */
  quietMs?: number;

  /** Runs a callback after a delay; defaults to `setTimeout`. */
  later?: (run: () => void, ms: number) => void;
}

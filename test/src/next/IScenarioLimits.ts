/**
 * The clock one scenario runs under, in seconds of wall time.
 *
 * The scenario's process ends itself at `limit` with its stack, or at `limit`
 * plus `grace` when its main thread cannot be paused; the runner ends a process
 * that has done neither by `limit` plus twice `grace`.
 */
export interface IScenarioLimits {
  /**
   * Seconds one scenario may run before it is a stall: the project's cap on one
   * spec.
   */
  limit: number;

  /**
   * Seconds the stall watch waits for the paused main thread's frames before it
   * ends the process without them.
   */
  grace: number;
}

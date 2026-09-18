import { IAutoMovieStorySyncPoint } from "./IAutoMovieStorySyncPoint";

/**
 * Measured verdict of one cross-shot story-clock simultaneity claim.
 *
 * @evidence requirements/story/story-clock-and-state.md#story-simultaneous-events Exposes `IAutoMovieStorySyncOutcome` as the portable data boundary for the story simultaneous events requirement.
 * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-story-synchronization Types `IAutoMovieStorySyncOutcome` for the narrative intent story synchronization system contract.
 */
export interface IAutoMovieStorySyncOutcome {
  /**
   * Every addressed event and where it landed on the story clock.
   *
   * @evidence requirements/story/story-clock-and-state.md#story-simultaneous-events Exposes `points` as the portable data boundary for the story simultaneous events requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-story-synchronization Types `points` for the narrative intent story synchronization system contract.
   */
  points: IAutoMovieStorySyncPoint[];
  /**
   * Widest gap between two addressed story times in seconds, or null when any
   * operand failed to resolve.
   *
   * @evidence requirements/story/story-clock-and-state.md#story-simultaneous-events Exposes `spreadSeconds` as the portable data boundary for the story simultaneous events requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-story-synchronization Types `spreadSeconds` for the narrative intent story synchronization system contract.
   */
  spreadSeconds: number | null;
  /**
   * Required tolerance in story seconds.
   *
   * @evidence requirements/story/story-clock-and-state.md#story-simultaneous-events Exposes `toleranceSeconds` as the portable data boundary for the story simultaneous events requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-story-synchronization Types `toleranceSeconds` for the narrative intent story synchronization system contract.
   */
  toleranceSeconds: number;
  /**
   * Whether every point resolved and the widest gap is within tolerance.
   *
   * @evidence requirements/story/story-clock-and-state.md#story-simultaneous-events Exposes `passed` as the portable data boundary for the story simultaneous events requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-story-synchronization Types `passed` for the narrative intent story synchronization system contract.
   */
  passed: boolean;
  /**
   * Deterministic one-line account of the measurement, naming the two events
   * that produced the widest gap or the first operand that failed to resolve.
   *
   * @evidence requirements/story/story-clock-and-state.md#story-simultaneous-events Exposes `summary` as the portable data boundary for the story simultaneous events requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-story-synchronization Types `summary` for the narrative intent story synchronization system contract.
   */
  summary: string;
}

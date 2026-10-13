import { IAutoMovieStorySyncPoint } from "./IAutoMovieStorySyncPoint";

/** Measured verdict of one cross-shot story-clock simultaneity claim. */
export interface IAutoMovieStorySyncOutcome {
  /** Every addressed event and where it landed on the story clock. */
  points: IAutoMovieStorySyncPoint[];

  /**
   * Widest gap between two addressed story times in seconds, or null when any
   * operand failed to resolve.
   */
  spreadSeconds: number | null;

  /** Required tolerance in story seconds. */
  toleranceSeconds: number;

  /** Whether every point resolved and the widest gap is within tolerance. */
  passed: boolean;

  /**
   * Deterministic one-line account of the measurement, naming the two events
   * that produced the widest gap or the first operand that failed to resolve.
   */
  summary: string;
}

import type { IAutoMovieStorySyncPoint } from "./IAutoMovieStorySyncPoint";

/** Measured verdict of one cross-shot story-clock simultaneity claim. */
export interface IAutoMovieStorySyncOutcome {
  /** Every addressed event and where it landed on the story clock. */
  points: IAutoMovieStorySyncPoint[];

  /**
   * Maximum minus minimum story seconds, or null when an operand failed to
   * resolve or the list is empty. Subtraction of extreme finite times can
   * overflow to Infinity, which fails a valid finite tolerance.
   */
  spreadSeconds: number | null;

  /** Required tolerance in story seconds. */
  toleranceSeconds: number;

  /** Whether every point resolved and the widest gap is within tolerance. */
  passed: boolean;

  /**
   * Deterministic one-line account of the widest gap, first unresolved operand
   * or empty list. Ties keep the first earliest event and the last latest event
   * in operand order.
   */
  summary: string;
}

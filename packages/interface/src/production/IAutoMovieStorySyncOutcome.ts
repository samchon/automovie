import { IAutoMovieStorySyncPoint } from "./IAutoMovieStorySyncPoint";

/**
 * Measured verdict of one cross-shot story-clock simultaneity claim.
 *
 * @evidence contracts/common.md#principled-implementation evaluateAutoMovieStorySync maps realized local event times through explicit pins and compares maximum minus minimum with the inclusive declared tolerance, reporting points in operand order. Pin validity, finite non-negative tolerance and criterion cardinality are upstream design-admission premises; the direct evaluator permits one point and does not recheck event uniqueness.
 * @evidence contracts/common.md#clear-and-simple-design Keeps individual measurements, aggregate spread and verdict beside one deterministic diagnostic account, without involving edit positions or image observations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing pins, missing or non-finite realizations and mapped overflow leave null spread and fail; an empty claim also fails rather than passing a vacuous synchronization assertion.
 * @evidence contracts/common.md#meaningful-documentation Defines addressed points, nullable widest gap, story-second tolerance, all-resolved verdict and deterministic extreme-or-refusal summary.
 * @author Samchon
 */
export interface IAutoMovieStorySyncOutcome {
  /** Every addressed event and where it landed on the story clock. */
  points: IAutoMovieStorySyncPoint[];

  /**
   * Maximum minus minimum story seconds, or null when an operand failed to resolve or the list is empty. Subtraction of extreme finite times can overflow to Infinity, which fails a valid finite tolerance.
   */
  spreadSeconds: number | null;

  /** Required tolerance in story seconds. */
  toleranceSeconds: number;

  /** Whether every point resolved and the widest gap is within tolerance. */
  passed: boolean;

  /**
   * Deterministic one-line account of the widest gap, first unresolved operand or empty list. Ties keep the first earliest event and the last latest event in operand order.
   */
  summary: string;
}

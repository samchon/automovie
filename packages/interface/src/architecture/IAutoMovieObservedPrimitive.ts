import { IAutoMovieDesignPoint } from "./IAutoMovieDesignPoint";

/**
 * One raw mark read from a frame, before any interpretation.
 *
 * A primitive says what is on the sheet, never what it means. Two readers who
 * disagree about a wall still agree about the two lines they both saw, which is
 * what keeps the disagreement recoverable.
 *
 * Every point must be finite and inside its frame's extent. Only `line`,
 * `polyline`, and `region` marks can be promoted to metric geometry; an `arc`
 * is recorded but withheld as unsupported geometry.
 *
 * @evidence contracts/common.md#principled-implementation Keeps a geometry family and source-space points whose count per family comes from the single `PRIMITIVE_POINTS` table in `validateDesignReference`, with each point finite and inside its frame and literal text present exactly for `text` and `level-marker`.
 * @evidence contracts/common.md#clear-and-simple-design Five fields and no meaning; interpretation lives on candidates, so competing readings share one primitive instead of copying it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The six kinds and their point counts are the contract's closed table; an arc's three points are kept as read rather than sampled into a polyline.
 * @evidence contracts/common.md#meaningful-documentation States the identity scope, the frame, the per-kind point counts, when `text` is set, the bounds rule, and which kinds can be promoted.
 * @author Samchon
 */
export interface IAutoMovieObservedPrimitive {
  /** Stable primitive identity within the document. */
  id: string;

  /** Frame this mark was read from. */
  frame: string;

  /** Raw geometry family exactly as read. */
  kind: "line" | "arc" | "polyline" | "region" | "text" | "level-marker";

  /**
   * Source-space points. A `line` carries exactly two, an `arc` carries start,
   * through and end, a `polyline` at least two, a closed `region` at least
   * three, and a `text` or `level-marker` exactly one anchor.
   */
  points: IAutoMovieDesignPoint[];

  /** Literal non-blank text for `text` and `level-marker`, otherwise null. */
  text: string | null;
}

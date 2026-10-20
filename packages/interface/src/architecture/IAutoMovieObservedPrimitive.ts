import { IAutoMovieDesignPoint } from "./IAutoMovieDesignPoint";

/**
 * One raw mark read from a frame, before any interpretation.
 *
 * A primitive says what is on the sheet, never what it means. Two readers who
 * disagree about a wall still agree about the two lines they both saw, which is
 * what keeps the disagreement recoverable.
 *
 * Every point must be finite and inside its frame's extent. Only `line`,
 * `polyline`, and `region` marks can be promoted to metric geometry; an `arc`,
 * `text`, or `level-marker` mark is recorded but withheld as unsupported
 * geometry.
 *
 * @evidence contracts/common.md#principled-implementation `validateDesignReference` resolves the frame, looks the kind up in one table of exact or minimum point counts, checks every point is finite and inside the frame's extent, and requires literal text exactly for `text` and `level-marker`.
 * @evidence contracts/common.md#clear-and-simple-design One record covers every mark family with a point list and an optional literal, and the per-family point counts live in a single validator table rather than in six record types.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Stored points remain in source units and arc/text/level-marker families are withheld from metric outline promotion. The gate checks authored family/count/range/text consistency, not whether pixels really contain the mark, distinct line endpoints, a simple region or its closure/area; a promoted line/polyline/region remains authored evidence rather than certified geometry recognition.
 * @evidence contracts/common.md#meaningful-documentation States that a primitive carries no meaning, the point count of every family, which families can become metric geometry, and when text is present or null.
 */
export interface IAutoMovieObservedPrimitive {
  /** Stable, non-blank primitive identity, unique within the document. */
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

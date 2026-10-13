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

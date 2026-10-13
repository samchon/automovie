/**
 * One structured defect or unsupported case a pattern run reports.
 *
 * The unit of `measured` and the meaning of `limit` follow `kind`:
 *
 * - `sliver`: one occurrence; surviving coverage fraction against the
 *   pattern's `minimumPiece`.
 * - `unsupported-piece`: one occurrence; square metres an exclusion punched
 *   out, against zero.
 * - `module-overlap`: two occurrences; their negative separation in metres,
 *   against zero.
 * - `joint-deviation`: two occurrences; their gap in metres against the
 *   nominal joint, reported when the difference exceeds `jointTolerance`.
 * - `grain-break`: two occurrences; grain deviation in degrees, read modulo
 *   180, against `grainToleranceDeg`.
 *
 * Per-occurrence findings come first in placement order, then pair findings
 * ordered by their first occurrence and then their partner.
 *
 * @author Samchon
 */
export interface IAutoMoviePatternFinding {
  /** What the run measured and found wanting. */
  kind:
    | "sliver"
    | "unsupported-piece"
    | "module-overlap"
    | "joint-deviation"
    | "grain-break";

  /** One occurrence id, or two for a pair, in ascending placement order. */
  occurrences: string[];

  /** The measured quantity, in the unit `kind` implies. */
  measured: number;

  /** The declared value the measurement was judged against, by `kind`. */
  limit: number;

  /** A statement an author or an agent can act on. */
  detail: string;
}

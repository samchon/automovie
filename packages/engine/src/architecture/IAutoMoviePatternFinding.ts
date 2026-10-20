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
 * @evidence contracts/common.md#principled-implementation Each kind fixes the unit of `measured` and the meaning of `limit`, so a finding is a typed measurement against a declared threshold rather than free text.
 * @evidence contracts/common.md#clear-and-simple-design One shape for single and pair findings, with `occurrences` holding one or two ids, keeps the list uniform for a reader that groups by kind.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Quality defects are reported, not thrown or silently corrected, and the thresholds come from the pattern declaration rather than fixture constants.
 * @evidence contracts/common.md#meaningful-documentation States the unit and limit per kind, the occurrence count per kind, the order of the list, and that `detail` is actionable text.
 * @evidenceExclude contracts/performance.md#efficient-algorithms No code; findings come from one pass over placements and a bucketed neighbour scan, answered on `generateAutoMovieSurfacePattern`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Produced per run and not shared across runs, since every threshold is part of the pattern.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds strings and two numbers in fresh arrays owned by the run result.
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

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
 * @evidence contracts/common.md#principled-implementation Each kind records the raw measurement beside the declared value it was judged against: coverage, punched area, separating-axis gap along the pieces' edge normals, or 180-periodic grain deviation.
 * @evidence contracts/common.md#clear-and-simple-design One record shape for all five kinds, with the unit carried by `kind`, so a reader filters by kind instead of matching five record types.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Thresholds come only from the pattern declaration; the `1e-9` m and `1e-12` coverage epsilons are uniform numeric slack, and pairs further apart than `adjacency` are not judged at all.
 * @evidence contracts/common.md#meaningful-documentation States the occurrence count, measured unit and limit meaning of each kind, the tolerance rule of a joint deviation, and the order of findings and ids.
 * @evidenceExclude contracts/performance.md#cost-and-resources Two numbers, a kind, a detail string and one or two ids inside the run result; pair findings come from a bucket-grid neighbour screen sized to the largest module diagonal plus adjacency, not an all-pairs sweep.
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

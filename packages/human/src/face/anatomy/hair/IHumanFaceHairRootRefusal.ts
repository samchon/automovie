import type { IHumanFaceHairStemRefusal } from "./IHumanFaceHairStemRefusal";

/**
 * Why a hair root refused: the integrator's attempted exit elevations did not let its stem clear the skin. Intermediate elevations remain untested.
 *
 * `lowest` and `highest` are the root's cited elevation interval in degrees (`humanFaceHairEmergenceRange`). `tried` lists every elevation walked, in order, each of which ended in a stem refusal; `stem` is the record of the stem refusal at the range top, the steepest exit the source allows.
 *
 * @evidence contracts/common.md#principled-implementation The diagnostic records only actually tried elevations and the refusing top stem, explicitly leaving intermediate elevations untested.
 * @evidence contracts/common.md#clear-and-simple-design Interval bounds, ordered tried list and final stem record keep the failure evidence together without replaying successful walks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A sampled refusal is not promoted to proof about every intermediate elevation, and no synthetic success replaces the failed stem.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies degree units, cited interval meaning, trial order and the final range-top stem record.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This refusal-data type selects no trial search; integrateHumanFaceHairCurve owns which elevations are attempted and when diagnostics are built.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Actual attempts are diagnostic effects of one root walk, so the record declares no coalescing of separate failed roots.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Tried-elevation count and the final stem's stations/trials determine diagnostic bytes until the caught error releases this record.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootRefusal {
  /** Lower end of the cited range, in degrees. */
  lowest: number;

  /** Upper end of the cited range, in degrees. */
  highest: number;

  /** Every elevation walked, in order, in degrees. */
  tried: number[];

  /** The stem refusal at the range top. */
  stem: IHumanFaceHairStemRefusal;
}

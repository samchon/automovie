import type { IHumanFaceHairStemStation } from "./IHumanFaceHairStemStation";
import type { IHumanFaceHairStemTrial } from "./IHumanFaceHairStemTrial";

/**
 * Why a rooted hair stem refused: the stations leading to the refusal and the trials at the last one.
 *
 * `stations` lists up to the last six stations, root side first; the last is where the stem refused. `trials` lists every trial chord made there, in order. The record is assembled only when the refusal happens, from state the walk already holds or recomputes deterministically, so an admitted lock pays nothing for it.
 *
 * @evidence contracts/common.md#principled-implementation Up to six recent stations and all trials at the last one describe a numerical rooted-stem refusal.
 * @evidence contracts/common.md#clear-and-simple-design The failure-only record separates diagnostic reconstruction from admitted lock output.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A diagnostic describes failed numerical construction and does not authorize an impossible chord or assert visual success.
 * @evidence contracts/common.md#meaningful-documentation Stations remain root-side first and trials preserve the order used at the refusing station.
 * @evidenceExclude contracts/performance.md#efficient-algorithms describeHumanFaceHairStemRefusal owns bounded station reconstruction and any budgeted query work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Last-station decisions are reused while earlier decisions may be recomputed from the same inputs.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The refusal owner retains station copies and borrowed trials only for error reporting; this type opens no query resource.
 *
 * @author Samchon
 */
export interface IHumanFaceHairStemRefusal {
  /** Up to the last six stations, root side first; the last refused. */
  stations: IHumanFaceHairStemStation[];

  /** Every trial chord at the refusing station, in order. */
  trials: IHumanFaceHairStemTrial[];
}

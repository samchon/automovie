import type { IHumanFaceHairStemStation } from "./IHumanFaceHairStemStation";
import type { IHumanFaceHairStemTrial } from "./IHumanFaceHairStemTrial";

/**
 * Why a rooted hair stem refused: the stations leading to the refusal and the
 * trials at the last one.
 *
 * `stations` lists up to the last six stations, root side first; the last is
 * where the stem refused. `trials` lists every trial chord made there, in
 * order. The record is assembled only when the refusal happens, from state the
 * walk already holds or recomputes deterministically, so an admitted lock pays
 * nothing for it.
 *
 * @author Samchon
 */
export interface IHumanFaceHairStemRefusal {
  /** Up to the last six stations, root side first; the last refused. */
  stations: IHumanFaceHairStemStation[];

  /** Every trial chord at the refusing station, in order. */
  trials: IHumanFaceHairStemTrial[];
}

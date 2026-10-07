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
 * @evidence contracts/common.md#principled-implementation Lets a refusal show which premise failed with the walk's own measured state instead of a separate probe.
 * @evidence contracts/common.md#clear-and-simple-design One record per refusal, owned by the stem walk that refuses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Assembled only on refusal; admitted geometry and work are unchanged.
 * @evidence contracts/common.md#meaningful-documentation States what is listed, its order and when it is built.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The station and trial records state their frames.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry A refused stem emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The contact and interval own the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical state only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived state, not a personal control.
 *
 * @author Samchon
 */
export interface IHumanFaceHairStemRefusal {
  /** Up to the last six stations, root side first; the last refused. */
  stations: IHumanFaceHairStemStation[];

  /** Every trial chord at the refusing station, in order. */
  trials: IHumanFaceHairStemTrial[];
}

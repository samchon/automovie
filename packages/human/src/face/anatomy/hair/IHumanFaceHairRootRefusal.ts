import type { IHumanFaceHairStemRefusal } from "./IHumanFaceHairStemRefusal";

/**
 * Why a hair root refused: no exit elevation in its cited range let the stem
 * clear the skin.
 *
 * `lowest` and `highest` are the root's cited elevation interval in degrees
 * (`humanFaceHairEmergenceRange`). `tried` lists every elevation walked, in
 * order, each of which ended in a stem refusal; `stem` is the record of the
 * stem refusal at the range top, the steepest exit the source allows.
 *
 * @evidence contracts/common.md#principled-implementation Reports the whole cited interval and each elevation tried, so the refusal proves the range was exhausted.
 * @evidence contracts/common.md#clear-and-simple-design Named members replace an anonymous record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reports state; it changes no admission.
 * @evidence contracts/common.md#meaningful-documentation States units, order and which stem record is kept.
 * @evidence contracts/modeling.md#spatial-conventions Elevations are degrees above the local tangent plane.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry A refused root emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The contact and interval own the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The range owner states the cited angles.
 * @evidenceExclude contracts/anatomy.md#permitted-range The range owner bounds the elevations.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived state, not a personal control.
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

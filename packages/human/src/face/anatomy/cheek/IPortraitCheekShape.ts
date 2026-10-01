import { IPortraitCheekVolume } from "./IPortraitCheekVolume";

/**
 * Independently authored cheek and perioral relief on one connected skin.
 * Support masses and the adjacent groove are separate controls: a nasolabial
 * crease alone does not supply the raised cheek beside it. The host supplies
 * current correspondence positions, not a validated three-dimensional smile.
 * These values add only the explicitly requested relief. Each basic region is
 * one axis-aligned envelope, not a complete reconstruction of a fat compartment
 * or a freely authored cheek section. Directional contour requirements need
 * an explicitly authored support profile and rendered verification.
 *
 * @evidence contracts/common.md#principled-implementation The record is four named envelopes plus one groove of three numbers, each a compact field on the shared skin; the comment states that the host supplies correspondence and not a validated smile, that each region is one axis-aligned envelope and no fat compartment, and that directional contours need an authored profile; the domains the type cannot express are enforced by createPortraitCheekLayer.
 * @evidence contracts/common.md#clear-and-simple-design Four regions share one volume type and the groove is three numbers beside them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration carries no behaviour, special case or compensating path.
 * @evidence contracts/common.md#meaningful-documentation The comment and members state each region, the groove, the unit and sign of each number, the limit of the model and the independence of the support masses and the crease.
 * @evidence contracts/modeling.md#parameter-channels The four masses and the groove are independent controls, as the comment states; a groove with zero depth leaves the skin unchanged and each mass is zero at neutral through its own projection and lift, with the positive direction documented on the members and the left and right sides authored as two layers by the socket side.
 * @evidence contracts/modeling.md#spatial-conventions Groove radii and depth are head-frame millimetres as stated on the members, and each region follows IPortraitCheekVolume in the same frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The type is a declaration and defines no part or group; the cheek layer that reads it is the part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The type decides no primitive population; it only describes data.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The type constructs no surface; the layer that reads it adds displacement fields to the shared skin.
 * @evidenceExclude contracts/modeling.md#rendered-observation The type is a declaration and displays nothing; the layer that reads it is observed by its owner.
 *
 * @author Samchon
 */
export interface IPortraitCheekShape {
  /** Upper cheek support below the lateral orbital margin. */
  malar: IPortraitCheekVolume;

  /** Medial cheek fullness beside the nasal wing and nasolabial groove. */
  medial: IPortraitCheekVolume;

  /** Lower lateral cheek transition towards the mandibular region. */
  buccal: IPortraitCheekVolume;

  /** Local perioral support outside the mouth corner. */
  modiolus: IPortraitCheekVolume;

  /** Positive transverse support radius of the groove, in mm. */
  foldWidth: number;

  /** Nonnegative posterior groove displacement, in mm, fading at both ends. */
  foldDepth: number;

  /** Positive depth support radius of the groove, in mm. */
  foldReach: number;
}

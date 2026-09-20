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
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Controls raised cheek masses independently of the adjacent nasolabial groove.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Defines four distinct support envelopes plus groove width, depth and depth reach on the shared skin.
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

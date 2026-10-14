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
 *
 * @evidence contracts/common.md#principled-implementation Four independent compact support envelopes and a separate groove describe explicitly authored cheek/perioral relief on one skin.
 * @evidence contracts/common.md#clear-and-simple-design Support masses are not conflated with the adjacent nasolabial groove and all remain inputs to the shared surface layer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Axis-aligned envelopes do not reconstruct a fat compartment or validate a three-dimensional smile; directional support requires authored data and visual review.
 * @evidence contracts/common.md#meaningful-documentation The prose states current host correspondence and limitations while groove members specify positive support and nonnegative millimetre depth.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IPortraitCheekShape is a TypeScript-only schema and executes no guide, surface or field algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IPortraitCheekShape declares inputs or results; copying and equivalence belong to its concrete producer/consumer.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IPortraitCheekShape acquires no runtime state or handle; array, map and callback lifetimes remain with their owning operations.
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

/**
 * One thickness-ratio witness along the right(-1) to left(+1) oral span.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Allows local vermilion thickness ratios along the anatomical oral span.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Defines an ordered transverse station and a positive thickness multiplier with one as identity.
 */
export interface IPortraitLipBandKnot {
  /** Ordered transverse fraction from anatomical right (-1) to left (+1). */
  at: number;

  /** Positive ratio of the current band's vertical thickness; one is identity. */
  scale: number;
}

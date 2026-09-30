/**
 * Independent vermilion relief, added to the existing measured lip in mm.
 * Body/tubercle/pad projections are signed; zero retains the original section.
 * Widths and pad separation are fractions of the inner mouth's half-width.
 *
 * @evidence contracts/common.md#principled-implementation Vermilion relief is expressed as three independent subunits, a broad body, a central upper tubercle and paired lower pads, each a signed projection in millimetres and a relative width, which is enough to add forward relief between two fixed lip boundaries without a per-vertex offset; the envelope that multiplies them lives in `createPortraitLipSection`.
 * @evidence contracts/common.md#clear-and-simple-design Seven members, one per independent quantity; the profile arithmetic stays in its one consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type carries data only: no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation Each member states its unit, sign and range, and the type states that zero retains the measured section and that widths are fractions of the oral half-width.
 * @evidence contracts/modeling.md#spatial-conventions Projections are millimetres in the head's forward (+Z) direction; widths and the pad offset are unitless fractions of the inner mouth's half-width, measured from the midline.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The type is one set of relief amounts for one lip and is not a part or a group.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The type emits no primitive; the relief moves existing lip vertices.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The type builds no surface; the section that consumes it returns exactly zero on both band edges and at both corners, so it cannot move the shared boundaries.
 * @evidenceExclude contracts/modeling.md#rendered-observation The type owns no part, group or joint.
 * @evidenceExclude contracts/anatomy.md#permitted-range The type admits nothing; `createPortraitLipSection` bounds the widths and the pad offset.
 * @evidence contracts/anatomy.md#parametric-authority Each member is a named projection of a named lip subunit, in millimetres, or a named relative width. None addresses a vertex, curve or patch; the relief is a deterministic smooth envelope of the lip's own boundary coordinates.
 * @author Samchon
 */
export interface IPortraitLipSection {
  /** Broad upper vermilion body projection, in mm. */
  upperBody: number;

  /** Additional central upper tubercle projection, in mm. */
  upperTubercle: number;

  /** Positive central-tubercle width as a fraction of oral half-width, at most one. */
  upperTubercleWidth: number;

  /** Broad lower vermilion body projection, in mm. */
  lowerBody: number;

  /** Additional projection of each lower lateral pad, in mm. */
  lowerPads: number;

  /** Each lower pad's distance from the midline as a half-width fraction, in [0,1]. */
  lowerPadOffset: number;

  /** Positive pad width as a fraction of oral half-width, at most one. */
  lowerPadWidth: number;
}

/**
 * Independent vermilion relief, added to the existing measured lip in mm.
 * Body/tubercle/pad projections are signed; zero retains the original section.
 * Widths and pad separation are fractions of the inner mouth's half-width.
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

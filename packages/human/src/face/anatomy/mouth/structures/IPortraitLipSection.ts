/**
 * Independent vermilion relief, added to the existing measured lip in mm. Body/tubercle/pad projections are signed; zero retains the original section. Widths and pad separation are fractions of the inner mouth's half-width.
 *
 * @evidence contracts/common.md#principled-implementation Independent signed upper body/tubercle and lower body/pad relief augment the existing band under normalized envelopes.
 * @evidence contracts/common.md#clear-and-simple-design createPortraitLipSection keeps rim/corner boundaries fixed while section and aperture remain separate controls.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These authored relief parameters are not recovered tissue measurements and width/offset admission supplies construction limits.
 * @evidence contracts/common.md#meaningful-documentation Projections are millimetres, widths/offsets are fractions of inner oral half-width and zero relief preserves the original section.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The section closure owns fixed Gaussian/polynomial evaluation work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One admitted copied profile serves every lip constraint in a component.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller owns authored scalar fields and the sampler retains its private copy until component release.
 *
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

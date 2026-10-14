/**
 * One authored lock represented by a curved strip, not individual hair tubes. Stations use head millimetres. Across vectors give the width direction and need not be unit length; their interpolated direction must remain nonzero. The root is an authored scalp attachment, not an inferred hairstyle.
 *
 * @evidence contracts/common.md#principled-implementation A legacy static lock uses ordered millimetre guide stations, matching width directions and full root width.
 * @evidence contracts/common.md#clear-and-simple-design The strip tessellator separates guide shape from fibre raster detail and resolution.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This guide-bearing low-level profile is not a named biological input; the numerical hair document remains the measurement-based surface.
 * @evidence contracts/common.md#meaningful-documentation Station count, millimetre frame and nonzero interpolated across-direction premises are documented.
 * @evidenceExclude contracts/performance.md#efficient-algorithms buildPortraitHairCards performs interpolation and strip allocation; this erased card type does not.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Live surface-seated groom conversion and legacy profiles reuse the same card tessellator.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The profile caller owns guide and across arrays until the mesh producer consumes them; no GPU resource is owned here.
 *
 * @author Samchon
 */
export interface IPortraitHairCard {
  /** Two through 32 ordered root-to-tip centreline witnesses, in mm. */
  guide: readonly (readonly [number, number, number])[];

  /** Width directions paired with guide stations, independent of view direction. */
  across: readonly (readonly [number, number, number])[];

  /** Positive full root width in mm, no greater than 40. */
  width: number;
}

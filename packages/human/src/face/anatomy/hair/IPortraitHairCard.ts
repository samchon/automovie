/**
 * One authored lock represented by a curved strip, not individual hair tubes.
 * Stations use head millimetres. Across vectors give the width direction and
 * need not be unit length; their interpolated direction must remain nonzero.
 * The root is an authored scalp attachment, not an inferred hairstyle.
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

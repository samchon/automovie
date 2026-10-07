/**
 * The briefs of one underwear style, as fractions along shaped landmarks.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyUnderwearBriefs {
  /** Waistband height, a fraction from the pelvis up to the lumbar landmark. */
  waist: number;

  /**
   * Leg line at the crotch, a fraction of the thigh's hip-to-knee length
   * below the hip joints' mean height.
   */
  crotch: number;

  /** Leg line at the outer hip in front, the same fraction (negative is above the hip joints). */
  front: number;

  /** Leg line at the outer hip behind, the same fraction. */
  back: number;

  /** Half width of the gusset, where the line leaves the crotch, a fraction of the hip joints' half distance from the midline. */
  gusset: number;

  /** Distance from the midline where the line reaches the outer hip, the same fraction. */
  outer: number;
}

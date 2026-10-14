/**
 * The briefs of one underwear style, as fractions along shaped landmarks.
 *
 * @evidence contracts/common.md#principled-implementation Waist, crotch and leg-line fractions place briefs on the shaped pelvis, lumbar and hip-to-knee segments.
 * @evidence contracts/common.md#clear-and-simple-design One style's rule carries front and back leg edges and gusset width together.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fractions follow shaped landmarks rather than a person-specific list of covered vertices.
 * @evidence contracts/common.md#meaningful-documentation Members state signed heights and the joint-distance scale used for widths.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The brief coverage fractions declares data and signatures without implementing runtime algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The brief coverage fractions declaration shares no computations across consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The brief coverage fractions type has no runtime acquisition, retention or release operation.
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

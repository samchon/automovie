/**
 * Skin depth and outward slope at the outer edge of a generated lid band.
 *
 * The interface package owns these declarations; AutoMovieHumanEyelidProfile in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanEyelidProfile {
  /**
   * The skin argument of AutoMovieHumanEyelidProfile.generate. One column of
   * the lid band, outer edge excluded: anterior surface, rounded anterior edge,
   * margin face, posterior edge and tuck.
   *
   * @param s Lid sample
   * @param g Seated globe
   * @param band Band width, mm
   * @param skin Skin depth relative to the globe centre at the band's outer
   *   edge, and its slope per mm outward
   * @param drift Tangential offset of the cut vertex from the sample's smooth
   *   outward line, which the anterior surface loses toward the margin
   * @returns Row points in mm
   */
  export type IGenerateSkin = {
    /**
     * Skin depth from the globe centre at the lid band's outer edge,
     * millimetres.
     */
    x: number;
    /** Derivative of skin depth per millimetre outward at that band edge. */
    k: number;
  };
}

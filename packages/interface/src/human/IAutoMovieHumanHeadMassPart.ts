/**
 * A constructed sagittal cervical point expressed as forward position and
 * height in millimetres.
 *
 * The interface package owns these declarations; AutoMovieHumanHeadMassPart in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanHeadMassPart {
  /**
   * Result of AutoMovieHumanHeadMassPart.cervical. Clinical C from Legan and
   * Burstone 1980 pp745-746, Fig1 and Table1. Their constructed Gn' is Sn-Pg'
   * intersected by the line from Me' making Sn-Gn'-C=100 degrees. C then stands
   * Sn-Gn'/1.2 along that posterior line. The posterior branch and population
   * means are explicit construction assumptions; neither contour Gn nor an
   * individual neck tangent/curvature is supplied by the public inputs. This is
   * a sagittal two-dimensional segment ratio, not a vertical-height
   * projection.
   *
   * @param plan The landmark skeleton.
   * @returns `[x, y]`, mm.
   */
  export type CervicalResult = [number, number];
}

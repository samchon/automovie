/** Type contracts exchanged by AutoMovieHumanHeadMassPart; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanHeadMassPart {
  /** Result of AutoMovieHumanHeadMassPart.cervical. Clinical C from Legan and Burstone 1980 pp745-746, Fig1 and Table1.
  Their constructed Gn' is Sn-Pg' intersected by the line from Me'
  making Sn-Gn'-C=100 degrees. C then stands Sn-Gn'/1.2 along that
  posterior line. The posterior branch and population means are explicit
  construction assumptions; neither contour Gn nor an individual neck
  tangent/curvature is supplied by the public inputs. This is a sagittal
  two-dimensional segment ratio, not a vertical-height projection.
  @param plan The landmark skeleton.
  @returns `[x, y]`, mm.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Clinical C from Legan and Burstone 1980 pp745-746, Fig1 and Table1.
 * @evidence contracts/development/design.md#principled-representation Clinical C from Legan and Burstone 1980 pp745-746, Fig1 and Table1. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHeadMassPart.CervicalResult is the canonical exchange used by AutoMovieHumanHeadMassPart.cervical.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHeadMassPart.cervical for clinical C from Legan and Burstone 1980 pp745-746, Fig1 and Table1.
 */
  export type CervicalResult = [number, number];
}

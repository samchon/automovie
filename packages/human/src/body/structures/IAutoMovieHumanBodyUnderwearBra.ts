/**
 * The sports bra of `bra-and-briefs`, placed on a named skin point and
 * shaped landmarks.
 *
 * @evidence contracts/common.md#principled-implementation Fractions between named shaped landmarks place the bra band and straps; a registered nipple skin point anchors the band.
 * @evidence contracts/common.md#clear-and-simple-design The bra rule separates front and back heights from strap placement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing registered nipple refuses the style rather than using a vertex from another body.
 * @evidence contracts/common.md#meaningful-documentation Members identify the landmark witness and the segment each fraction scales.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The bra coverage fractions declares data and signatures without implementing runtime algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The bra coverage fractions declaration shares no computations across consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The bra coverage fractions type has no runtime acquisition, retention or release operation.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyUnderwearBra {
  /**
   * The basis skin landmark (`IAutoMovieHumanBodyBasis.skinLandmarks`) the
   * band is placed on: the left nipple-areola fill's centre. A basis that
   * does not declare it refuses the style by that name.
   */
  nipple: string;

  /** Lower edge, a fraction from the nipple down to the lower-chest landmark. */
  bottom: number;

  /** Upper edge in front, a fraction from the nipple up to the clavicle landmark. */
  front: number;

  /** Upper edge at the back, the same fraction; the edge blends to it over the chest's depth. */
  back: number;

  /** Strap centre, a fraction from the clavicle out to the shoulder landmark. */
  strap: number;

  /** Strap half width, the same fraction. */
  strapHalfWidth: number;
}

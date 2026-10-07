/**
 * The sports bra of `bra-and-briefs`, placed on a named skin point and
 * shaped landmarks.
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

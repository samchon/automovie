/**
 * A basis's one connected skin surface, the surface that draws the skin
 * material, with its ordinal in the basis's surface list.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSkinSurface<T> {
  /** Ordinal of the skin surface in the basis's surface list. */
  index: number;

  /** The skin surface. */
  surface: T;
}

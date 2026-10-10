import type { IAutoMovieHumanBodyLinearRgb } from "./IAutoMovieHumanBodyLinearRgb";

/**
 * The body's cheek albedo reference in linear RGB. Appearance derives its
 * other sites through the existing site table; a linked person derives this
 * reference from its face instead of authoring an independent body colour.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySkinColour {
  /** Cheek albedo, linear RGB with each component in (0,1]. */
  cheek: IAutoMovieHumanBodyLinearRgb;
}

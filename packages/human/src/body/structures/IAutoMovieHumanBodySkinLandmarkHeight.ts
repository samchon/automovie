/**
 * The vertical height of a named skin point above a ground landmark, as an
 * anthropometer reads a drawn landmark's height from the standing surface.
 *
 * `to` is a fixed anatomical landmark registered on the basis skin
 * (`skinLandmarks`), so the reading follows it on every shape; `from` is the
 * joint landmark the horizontal ground plane passes through.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySkinLandmarkHeight {
  /** A skin landmark's height above the ground plane. */
  kind: "skin-height";

  /** Joint landmark id the horizontal ground plane passes through. */
  from: string;

  /** Skin landmark name whose height is read. */
  to: string;
}

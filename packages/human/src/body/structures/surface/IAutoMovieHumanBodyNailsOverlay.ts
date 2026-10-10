import type { IAutoMovieHumanBodyLinearRgb } from "../IAutoMovieHumanBodyLinearRgb";

/**
 * Source-authored nail appearance overlay, distinct from the underlying skin and authored vein layer.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyNailsOverlay {
  /** Closed layer kind. */
  kind: "nails";

  /** Existing skin material receiving the layer. */
  material: string;

  /** sRGB colour and alpha coverage PNG data URI. */
  color: string;

  /** Optional linear tangent-space normal PNG data URI. */
  normal?: string;

  /** Authored nail surface roughness in [0,1]. */
  roughness: number;

  /** Optional linear cheek reference used by the existing pigmentation owner. */
  cheek?: IAutoMovieHumanBodyLinearRgb;
}

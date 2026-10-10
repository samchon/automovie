import type { IAutoMovieHumanFaceMaterialRgb } from "./IAutoMovieHumanFaceMaterialRgb";

/**
 * Appearance edits to one existing facial source material.
 *
 * Base colour and roughness retain their normalized source-material meaning.
 * Fibre pigment and density require source coverage registration: the card
 * consumer paints their alpha texture, while numerical shafts use the same
 * pigment and an explicitly qualified opacity-gain conversion. Density is
 * neither a shaft count nor a geometric growth control. Omission retains the
 * corresponding source value; no mean complexion or pigment is supplied.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceMaterialOverride {
  /** Complete linear RGB override, each channel in [0,1]. */
  color?: IAutoMovieHumanFaceMaterialRgb;

  /** Surface roughness in [0,1], independent from base colour. */
  roughness?: number;

  /** Fibre linear RGB pigment in [0,1], requiring registered source coverage. */
  pigment?: [number, number, number];

  /** Coverage gain in [0,4], distinct from explicit numerical shaft count. */
  density?: number;
}

import type { IAutoMovieHumanFaceScalpHairLayer } from "./IAutoMovieHumanFaceScalpHairLayer";

/**
 * Named scalp populations authored without personal coordinates or curves.
 * Empty layers explicitly mean bald. Omission of this section preserves the
 * legacy hairstyle rather than selecting an unrelated population or source.
 * Each layer owns its traits; the shared basis retains source rights and growth
 * registration. Styling inputs do not certify a biological population fit.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceScalpHair {
  /** Ordered independent populations, at most eight. */
  layers: IAutoMovieHumanFaceScalpHairLayer[];
}

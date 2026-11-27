import type { IAutoMovieHumanAcne } from "./IAutoMovieHumanAcne";
import type { IAutoMovieHumanFreckles } from "./IAutoMovieHumanFreckles";
import type { IAutoMovieHumanMoles } from "./IAutoMovieHumanMoles";

/** Skin surface finish on top of the identity's pigmentation. */
export interface IAutoMovieHumanSkinAppearance {
  /**
   * Surface oil, from dry (0) to oily (1), dimensionless, after the oiliness
   * parameter of Donner and Jensen (2006, Eurographics Symposium on Rendering).
   * Schema constraints: Minimum: 0; Maximum: 1; retained by Human's schema
   * refinement.
   */
  oiliness: number;

  /**
   * Requested depth of fine surface wrinkles, from the faint lines of young
   * skin (0) to the deep furrows of old, sun-exposed skin (1), dimensionless.
   * Schema constraints: Minimum: 0; Maximum: 1; retained by Human's schema
   * refinement.
   */
  wrinkles: number;

  /**
   * Stable unsigned 32-bit seed for surface marks; omitted, zero. Independent
   * of identity, ancestry and mesh sampling. Schema constraints: Type:
   * "uint32"; retained by Human's schema refinement.
   */
  seed?: number;

  /** Freckle pigment marks; omitted or zero density/contrast requests no marks. */
  freckles?: IAutoMovieHumanFreckles;

  /** Moles and beauty marks; omitted or zero count/contrast requests none. */
  moles?: IAutoMovieHumanMoles;

  /**
   * Inflamed spot appearance and shallow papule relief; omitted or zero
   * density/severity requests none. This is an appearance control, not a
   * diagnosis or scar model.
   */
  acne?: IAutoMovieHumanAcne;
}

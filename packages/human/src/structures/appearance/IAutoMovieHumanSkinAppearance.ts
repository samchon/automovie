import { tags } from "typia";

import { IAutoMovieHumanAcne } from "./IAutoMovieHumanAcne";
import { IAutoMovieHumanFreckles } from "./IAutoMovieHumanFreckles";
import { IAutoMovieHumanMoles } from "./IAutoMovieHumanMoles";

/**
 * Skin surface finish on top of the identity's pigmentation.
 */
export interface IAutoMovieHumanSkinAppearance {
  /**
   * Surface oil, from dry (0) to oily (1), dimensionless, after the oiliness parameter of Donner and Jensen (2006, Eurographics Symposium on Rendering).
   */
  oiliness: number & tags.Minimum<0> & tags.Maximum<1>;

  /**
   * Requested depth of fine surface wrinkles, from the faint lines of young skin (0) to the deep furrows of old, sun-exposed skin (1), dimensionless.
   */
  wrinkles: number & tags.Minimum<0> & tags.Maximum<1>;

  /** Stable unsigned 32-bit seed for surface marks; omitted, zero. Independent of identity, ancestry and mesh sampling. */
  seed?: number & tags.Type<"uint32">;

  /** Freckle pigment marks; omitted or zero density/contrast requests no marks. */
  freckles?: IAutoMovieHumanFreckles;

  /** Moles and beauty marks; omitted or zero count/contrast requests none. */
  moles?: IAutoMovieHumanMoles;

  /** Inflamed spot appearance and shallow papule relief; omitted or zero density/severity requests none. This is an appearance control, not a diagnosis or scar model. */
  acne?: IAutoMovieHumanAcne;
}

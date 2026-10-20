import { tags } from "typia";

import { IAutoMovieHumanAcne } from "./IAutoMovieHumanAcne";
import { IAutoMovieHumanFreckles } from "./IAutoMovieHumanFreckles";

/**
 * Skin surface finish on top of the identity's pigmentation.
 */
export interface IAutoMovieHumanSkinAppearance {
  /**
   * Surface oil, from dry (0) to oily (1), dimensionless; it weights the specular sheen of the skin, after the oiliness parameter of Donner and Jensen (2006, Eurographics Symposium on Rendering).
   */
  oiliness: number & tags.Minimum<0> & tags.Maximum<1>;

  /**
   * Depth of the fine wrinkles that cut the skin's surface into plateaus, from the faint lines of young skin (0) to the deep furrows of old, sun-exposed skin (1), dimensionless; it deepens the furrow network of the generated micro-relief.
   */
  wrinkles: number & tags.Minimum<0> & tags.Maximum<1>;

  /** Stable unsigned 32-bit seed for surface marks; omitted, zero. Independent of identity, ancestry and mesh sampling. */
  seed?: number & tags.Type<"uint32">;

  /** Freckle pigment marks; omitted or zero density/contrast emits no mark image. */
  freckles?: IAutoMovieHumanFreckles;

  /** Inflamed spots and shallow normal-map papules; omitted or zero density/severity emits none. This is an appearance control, not a diagnosis or scar model. */
  acne?: IAutoMovieHumanAcne;
}

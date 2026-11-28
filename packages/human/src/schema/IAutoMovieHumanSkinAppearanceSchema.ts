import type { IAutoMovieHumanSkinAppearance } from "@automovie/interface";
import type { tags } from "typia";

import type { IAutoMovieHumanAcneSchema } from "./IAutoMovieHumanAcneSchema";
import type { IAutoMovieHumanFrecklesSchema } from "./IAutoMovieHumanFrecklesSchema";
import type { IAutoMovieHumanMolesSchema } from "./IAutoMovieHumanMolesSchema";

/**
 * Skin surface finish for a typia validator or schema. Oiliness and wrinkle
 * depth are fractions in [0, 1]. An unsigned 32-bit seed and descriptors for
 * freckles, moles and acne are optional.
 */
export type IAutoMovieHumanSkinAppearanceSchema =
  IAutoMovieHumanSkinAppearance & {
    /**
     * Surface oil, from dry (0) to oily (1), dimensionless, after the oiliness parameter of Donner and Jensen (2006, Eurographics Symposium on Rendering).
     */
    oiliness: number & tags.Minimum<0> & tags.Maximum<1>;

    /**
     * Requested depth of fine surface wrinkles, from the faint lines of young skin (0) to the deep furrows of old, sun-exposed skin (1), dimensionless.
     */
    wrinkles: number & tags.Minimum<0> & tags.Maximum<1>;

    /** Unsigned 32-bit seed supplied for surface marks. */
    seed?: number & tags.Type<"uint32">;

    /** Freckle pigment marks; omitted or zero density/contrast requests no marks. */
    freckles?: IAutoMovieHumanFrecklesSchema;

    /** Moles and beauty marks; omitted or zero count/contrast requests none. */
    moles?: IAutoMovieHumanMolesSchema;

    /** Optional facial spots with density, maximum diameter and redness coverage. */
    acne?: IAutoMovieHumanAcneSchema;
  };

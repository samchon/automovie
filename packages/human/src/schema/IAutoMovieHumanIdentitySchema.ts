import type { IAutoMovieHumanIdentity } from "@automovie/interface";

import type { IAutoMovieHumanBodyIdentitySchema } from "./IAutoMovieHumanBodyIdentitySchema";
import type { IAutoMovieHumanCompositionSchema } from "./IAutoMovieHumanCompositionSchema";
import type { IAutoMovieHumanHeadIdentitySchema } from "./IAutoMovieHumanHeadIdentitySchema";
import type { IAutoMovieHumanPigmentationSchema } from "./IAutoMovieHumanPigmentationSchema";

/**
 * Detailed Human identity for typia validation. Supply body and head
 * measurements, body composition and constitutive pigmentation. Nested fields
 * retain their documented units and left and right measurements.
 */
export type IAutoMovieHumanIdentitySchema = IAutoMovieHumanIdentity & {
  /** Trunk, limbs and body landmarks. */
  body: IAutoMovieHumanBodyIdentitySchema;

  /** Cranial vault and face frame. */
  head: IAutoMovieHumanHeadIdentitySchema;

  /** Whole-body fat, limb lean mass index and regional subcutaneous thickness. */
  composition: IAutoMovieHumanCompositionSchema;

  /** Skin and iris pigmentation. */
  pigmentation: IAutoMovieHumanPigmentationSchema;
};

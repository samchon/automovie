import type { IAutoMovieHumanIdentity } from "@automovie/interface";

import type { IAutoMovieHumanBodyIdentitySchema } from "./IAutoMovieHumanBodyIdentitySchema";
import type { IAutoMovieHumanCompositionSchema } from "./IAutoMovieHumanCompositionSchema";
import type { IAutoMovieHumanHeadIdentitySchema } from "./IAutoMovieHumanHeadIdentitySchema";
import type { IAutoMovieHumanPigmentationSchema } from "./IAutoMovieHumanPigmentationSchema";

/** Typia admission/schema metadata for IAutoMovieHumanIdentity. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanIdentitySchema = IAutoMovieHumanIdentity & {
  /** Trunk, limbs and body landmarks. */
  body: IAutoMovieHumanBodyIdentitySchema;

  /** Cranial vault and face frame. */
  head: IAutoMovieHumanHeadIdentitySchema;

  /** Fat and lean mass, which decide surface relief and where volume sits. */
  composition: IAutoMovieHumanCompositionSchema;

  /** Skin and iris pigmentation. */
  pigmentation: IAutoMovieHumanPigmentationSchema;
};

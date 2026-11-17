import type { IAutoMovieHumanParameters } from "@automovie/interface";

import type { IAutoMovieHumanAppearanceSchema } from "./IAutoMovieHumanAppearanceSchema";
import type { IAutoMovieHumanBodyParametersSchema } from "./IAutoMovieHumanBodyParametersSchema";
import type { IAutoMovieHumanExpressionSchema } from "./IAutoMovieHumanExpressionSchema";
import type { IAutoMovieHumanExtremityDimensionsSchema } from "./IAutoMovieHumanExtremityDimensionsSchema";
import type { IAutoMovieHumanHeadIdentitySchema } from "./IAutoMovieHumanHeadIdentitySchema";
import type { IAutoMovieHumanPigmentationSchema } from "./IAutoMovieHumanPigmentationSchema";
import type { IAutoMovieHumanPoseSchema } from "./IAutoMovieHumanPoseSchema";

/** Typia admission/schema metadata for IAutoMovieHumanParameters. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanParametersSchema = IAutoMovieHumanParameters & {
  /** Body tapes, lengths, skeletal breadths, landmark heights and composition. */
  body: IAutoMovieHumanBodyParametersSchema;

  /** Cranial and facial dimensions. */
  head: IAutoMovieHumanHeadIdentitySchema;

  /** Independent hand and foot dimensions when supplied. */
  extremities?: IAutoMovieHumanExtremityDimensionsSchema;

  /** Skin, hair, brows, eyelashes and underwear choices. */
  appearance?: IAutoMovieHumanAppearanceSchema;

  /** Constitutive skin and iris pigmentation. */
  pigmentation?: IAutoMovieHumanPigmentationSchema;

  /** Joint angles of every movable joint in clinical degrees; omitted joints keep the generated rest posture. */
  pose?: IAutoMovieHumanPoseSchema;

  /** Facial action-unit intensities. */
  expression?: IAutoMovieHumanExpressionSchema;
};

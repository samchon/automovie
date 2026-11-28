import type { IAutoMovieHumanParameters } from "@automovie/interface";

import type { IAutoMovieHumanAppearanceSchema } from "./IAutoMovieHumanAppearanceSchema";
import type { IAutoMovieHumanBodyParametersSchema } from "./IAutoMovieHumanBodyParametersSchema";
import type { IAutoMovieHumanExpressionSchema } from "./IAutoMovieHumanExpressionSchema";
import type { IAutoMovieHumanExtremityDimensionsSchema } from "./IAutoMovieHumanExtremityDimensionsSchema";
import type { IAutoMovieHumanHeadIdentitySchema } from "./IAutoMovieHumanHeadIdentitySchema";
import type { IAutoMovieHumanPigmentationSchema } from "./IAutoMovieHumanPigmentationSchema";
import type { IAutoMovieHumanPoseSchema } from "./IAutoMovieHumanPoseSchema";

/**
 * Complete Human input for a typia validator or generated schema. Body and
 * head measurements are required. Extremities, appearance, pigmentation, pose
 * and expression carry their own units and constraints when supplied.
 */
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

  /** Clinical pose channels in degrees, except jaw distances in millimetres; omitted channels use the evaluator's neutral defaults. */
  pose?: IAutoMovieHumanPoseSchema;

  /** Facial action-unit intensities. */
  expression?: IAutoMovieHumanExpressionSchema;
};

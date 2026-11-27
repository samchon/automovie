import type { IAutoMovieHumanAppearance } from "./IAutoMovieHumanAppearance";
import type { IAutoMovieHumanPigmentation } from "./IAutoMovieHumanPigmentation";
import type { IAutoMovieHumanBodyParameters } from "./IAutoMovieHumanBodyParameters";
import type { IAutoMovieHumanExtremityDimensions } from "./IAutoMovieHumanExtremityDimensions";
import type { IAutoMovieHumanExpression } from "./IAutoMovieHumanExpression";
import type { IAutoMovieHumanHeadIdentity } from "./IAutoMovieHumanHeadIdentity";
import type { IAutoMovieHumanPose } from "./IAutoMovieHumanPose";

/**
 * Complete Human input. Lengths, angles and unknown values retain each field's
 * documented units and meaning.
 */
export interface IAutoMovieHumanParameters {
  /** Body tapes, lengths, skeletal breadths, landmark heights and composition. */
  body: IAutoMovieHumanBodyParameters;

  /** Cranial and facial dimensions. */
  head: IAutoMovieHumanHeadIdentity;

  /** Independent hand and foot dimensions when supplied. */
  extremities?: IAutoMovieHumanExtremityDimensions;

  /** Skin, hair, brows, eyelashes and underwear choices. */
  appearance?: IAutoMovieHumanAppearance;

  /** Constitutive skin and iris pigmentation. */
  pigmentation?: IAutoMovieHumanPigmentation;

  /**
   * Clinical pose channels in degrees, except jaw distances in millimetres;
   * omitted channels use the evaluator's neutral defaults.
   */
  pose?: IAutoMovieHumanPose;

  /** Facial action-unit intensities. */
  expression?: IAutoMovieHumanExpression;
}

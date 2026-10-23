import type { IAutoMovieHumanAppearance } from "./appearance/IAutoMovieHumanAppearance";
import type { IAutoMovieHumanPigmentation } from "./appearance/IAutoMovieHumanPigmentation";
import type { IAutoMovieHumanBodyParameters } from "./body/IAutoMovieHumanBodyParameters";
import type { IAutoMovieHumanCurveSupplement } from "./body/IAutoMovieHumanCurveSupplement";
import type { IAutoMovieHumanExtremityDimensions } from "./body/IAutoMovieHumanExtremityDimensions";
import type { IAutoMovieHumanExpression } from "./expression/IAutoMovieHumanExpression";
import type { IAutoMovieHumanHeadIdentity } from "./head/IAutoMovieHumanHeadIdentity";
import type { IAutoMovieHumanPose } from "./pose/IAutoMovieHumanPose";

/** Complete Human input. Lengths, angles and unknown values retain each field's documented units and meaning. */
export interface IAutoMovieHumanParameters {
  /** Authored body controls and independent physical observations. */
  body: IAutoMovieHumanBodyParameters;

  /** Cranial and facial dimensions. */
  head: IAutoMovieHumanHeadIdentity;

  /** Independent hand and foot dimensions when supplied. */
  extremities?: IAutoMovieHumanExtremityDimensions;

  /** Additional measured physical dimensions. */
  supplement?: IAutoMovieHumanCurveSupplement;

  /** Skin, hair, brows, eyelashes and underwear choices. */
  appearance?: IAutoMovieHumanAppearance;

  /** Constitutive skin and iris pigmentation. */
  pigmentation?: IAutoMovieHumanPigmentation;

  /** Joint angles of every movable joint in clinical degrees; omitted joints keep the generated rest posture. */
  pose?: IAutoMovieHumanPose;

  /** Facial action-unit intensities. */
  expression?: IAutoMovieHumanExpression;
}

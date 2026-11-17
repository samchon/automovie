import type { IAutoMovieHumanAppearance } from "./appearance/IAutoMovieHumanAppearance";
import type { IAutoMovieHumanPigmentation } from "./appearance/IAutoMovieHumanPigmentation";
import type { IAutoMovieHumanBodyParameters } from "./body/IAutoMovieHumanBodyParameters";
import type { IAutoMovieHumanExtremityDimensions } from "./body/IAutoMovieHumanExtremityDimensions";
import type { IAutoMovieHumanExpression } from "./expression/IAutoMovieHumanExpression";
import type { IAutoMovieHumanHeadIdentity } from "./head/IAutoMovieHumanHeadIdentity";
import type { IAutoMovieHumanPose } from "./pose/IAutoMovieHumanPose";

/** Complete Human input. Lengths, angles and unknown values retain each field's documented units and meaning.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Complete Human input.
 * @evidence contracts/development/design.md#principled-representation `body`: Body tapes, lengths, skeletal breadths, landmark heights and composition. `head`: Cranial and facial dimensions. `extremities`: Independent hand and foot dimensions when supplied.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanBodyAnatomy.resolve, AutoMovieHumanBodyAnatomy.sexOf, AutoMovieHumanBodyLaw.limbInputs. Also types AutoMovieHumanBodyAnatomy.feet, AutoMovieHumanBodyAnatomy.hands.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `extremities`: Independent hand and foot dimensions when supplied. `appearance`: Skin, hair, brows, eyelashes and underwear choices. `pigmentation`: Constitutive skin and iris pigmentation. `pose`: Clinical pose channels in degrees, except jaw distances in millimetres; omitted channels use the evaluator's neutral defaults. `expression`: Facial action-unit intensities.
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

  /** Clinical pose channels in degrees, except jaw distances in millimetres; omitted channels use the evaluator's neutral defaults. */
  pose?: IAutoMovieHumanPose;

  /** Facial action-unit intensities. */
  expression?: IAutoMovieHumanExpression;
}

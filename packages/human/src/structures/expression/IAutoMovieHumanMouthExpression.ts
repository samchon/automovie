import type { IAutoMovieHumanLipExpression } from "./IAutoMovieHumanLipExpression";
import type { IAutoMovieHumanTongueExpression } from "./IAutoMovieHumanTongueExpression";
import type { IAutoMovieHumanVisemeWeights } from "./IAutoMovieHumanVisemeWeights";

/**
 * Mouth articulation for speech and expression, top to bottom: lips, then tongue, with an optional viseme layer. The jaw belongs to the pose (`IAutoMovieHumanJawPose`).
 *
 * Not consumed yet: the generator neither opens the mouth nor builds lips, teeth or tongue geometry; a later mouth-geometry task will. Lip fields restate FACS action units as named intensities; an action unit given both here and in `IAutoMovieHumanExpression.units` is not a valid expression. Omitted fields are at rest.
 */
export interface IAutoMovieHumanMouthExpression {
  /** Lip action units. */
  lips?: IAutoMovieHumanLipExpression;

  /** Tongue position. */
  tongue?: IAutoMovieHumanTongueExpression;

  /** Viseme blend weights, an alternative speech description. */
  visemes?: IAutoMovieHumanVisemeWeights;
}

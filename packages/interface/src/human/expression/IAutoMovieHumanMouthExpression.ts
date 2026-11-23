import type { IAutoMovieHumanLipExpression } from "./IAutoMovieHumanLipExpression";
import type { IAutoMovieHumanTongueExpression } from "./IAutoMovieHumanTongueExpression";
import type { IAutoMovieHumanVisemeWeights } from "./IAutoMovieHumanVisemeWeights";

/**
 * Mouth articulation for speech and expression, top to bottom: lips, then tongue, with an optional viseme layer. The jaw belongs to the pose (`IAutoMovieHumanJawPose`).
 *
 * The generator opens the skin along the lips' contact line and builds the teeth, tongue and the cavity's lining behind it; `AutoMovieHumanMouthExpression` resolves this description into displacements of lips, cheeks and tongue and a jaw opening, which the caller adds to the pose. Lip fields restate FACS action units as named intensities; an action unit given both here and in `IAutoMovieHumanExpression.units` is not a valid expression. Omitted fields are at rest.
 */
export interface IAutoMovieHumanMouthExpression {
  /** Lip action units. */
  lips?: IAutoMovieHumanLipExpression;

  /** Tongue position. */
  tongue?: IAutoMovieHumanTongueExpression;

  /** Viseme blend weights, an alternative speech description. */
  visemes?: IAutoMovieHumanVisemeWeights;
}

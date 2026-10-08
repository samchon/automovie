import type { IHumanBodyConstructionProgress } from "./IHumanBodyConstructionProgress";
import type { IAutoMovieHumanBodyPosedSurface } from "./IAutoMovieHumanBodyPosedSurface";
import type { IAutoMovieHumanBodyUnderwear } from "./IAutoMovieHumanBodyUnderwear";
import type { IAutoMovieHumanBodyUnderwearRest } from "./IAutoMovieHumanBodyUnderwearRest";

/**
 * What the compiled underwear builder reads per document: the garment asked
 * for, the body at rest and its posed surfaces.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyUnderwearProps {
  /** The garment the document wears. */
  underwear: IAutoMovieHumanBodyUnderwear;

  /**
   * Current invocation's synchronous construction observer; omission leaves it
   * absent and does not build intermediate scalar readings. This is not an authored document field or cached callback.
   * Exceptions abort the same original garment call.
   */
  observeFitting?: (
    stage: Extract<IHumanBodyConstructionProgress["stage"],
      "garment-component-read" | "garment-envelope-evaluated" |
      "garment-initial-evaluated" | "garment-affine-program-assembled" |
      "garment-native-round-completed" |
      "garment-candidate-normals-evaluated" |
      "garment-candidate-vertices-evaluated" |
      "garment-candidate-faces-evaluated" |
      "garment-candidate-evaluated" | "garment-proposal-evaluated">,
    details: Pick<IHumanBodyConstructionProgress,
      "completed" | "total" | "garmentSurface" | "garmentComponent" | "garmentPhase" | "garmentRound" |
      "garmentWorkUsed" | "garmentWorkBound" | "garmentVariables" | "garmentRows" |
      "garmentEntries" | "garmentMinimumNonzeroCoefficient" | "garmentMaximumCoefficient" |
      "garmentFieldResidualMetres" | "garmentGeometryFailures" | "garmentFittingRound" | "garmentProposal">,
  ) => void;

  /** The document's body at rest. */
  rest: IAutoMovieHumanBodyUnderwearRest;

  /** The posed surfaces, in basis surface order. */
  posed: IAutoMovieHumanBodyPosedSurface[];
}

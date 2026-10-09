import type { IHumanBodyConstructionProgress } from "../structures/IHumanBodyConstructionProgress";
import type { IHumanBodyUnderwearEnvelope } from "./IHumanBodyUnderwearEnvelope";

/**
 * Original connected material and the actual normal operation it must restore.
 *
 * @author Samchon
 */
export interface IHumanBodyUnderwearSurfaceFitInput {
  /** Complete original cut positions in posed skin metres. */
  points: readonly number[];

  /**
   * This legacy crease-fit invocation's synchronous scalar observer, independent
   * of the basic skin-material garment. Omission creates no progress readings;
   * callback exceptions abort this same fit. It is not an authored document field.
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

  /** Actual supplied outward directions at the original material samples. */
  normals: readonly number[];

  /** Original cut triangle incidence; fitting removes no material face. */
  indices: readonly number[];

  /** Existing component member ordinals in the original cut; never native skin IDs. */
  sourceVertices: readonly number[];

  /** One original qualified exterior-ball field shared by fit and evaluation. */
  envelope: IHumanBodyUnderwearEnvelope;

  /** Existing garment ball radius, metres. */
  rho: number;

  /** Existing signed normal lift, metres; zero is the identity. */
  offsetMetres: number;
}

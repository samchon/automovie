import type { IHumanBodyUnderwearFitObservation } from "./IHumanBodyUnderwearFitObservation";
import type { IHumanBodyUnderwearSurfaceEvaluation } from "./IHumanBodyUnderwearSurfaceEvaluation";

/** A connected material result qualified by its actual final forward calculation. */
export interface IHumanBodyUnderwearSurfaceFit {
  /** Base material positions, retaining the existing internal result meaning. */
  positions: number[];

  /** Actual buffers accepted by the fitter and consumed without recomputation. */
  evaluation: IHumanBodyUnderwearSurfaceEvaluation;

  /** Native solver and original actual conditions; no global optimum is claimed. */
  observations: IHumanBodyUnderwearFitObservation[];
}

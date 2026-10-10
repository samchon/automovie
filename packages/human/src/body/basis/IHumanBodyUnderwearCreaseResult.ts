import type { IHumanBodyUnderwearFitObservation } from "./IHumanBodyUnderwearFitObservation";

/** Closed and lifted vertices retaining the cut garment's index population. */
export interface IHumanBodyUnderwearCreaseResult {
  /** Flat XYZ positions in the input skin metre frame. */
  positions: number[];
  /** Unit normals used for the garment lift. */
  normals: number[];
  /** Actual nonlinear solve readings; absence retains compatibility with older callers. */
  fitting?: IHumanBodyUnderwearFitObservation[];
  /** Closing contribution in [0, 1] for each cut vertex. */
  bridged: number[];
}

import type { IAutoMovieConstructionPolyline } from "../../render/IAutoMovieConstructionPolyline";

/** Tensor control-net construction generated from the retained recipe. */

export interface IAutoMovieRecoveryTensorConstruction
  extends IAutoMovieConstructionPolyline.IMutable {
  /** Optional normalized generating phases aligned with construction points. */
  phases?: number[];
}

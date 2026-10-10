import type {
  IAutoMovieMeshQueryBudget,
  createAutoMovieSignedMeshQuery,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairRetraction } from "./IHumanFaceHairRetraction";

/**
 * The surface contact one hair curve keeps against its closed collider,
 * returned by `humanFaceHairContact`.
 *
 * Distances are current head-frame metres. `clearance` is half a sampling
 * step plus the requested clearance plus twice `epsilon`, so a chord no longer
 * than `step` between two stations that each keep it keeps it along its whole
 * length (distance to a closed set is 1-Lipschitz). The readers share one
 * collider instance and its last-sample and free-witness memory.
 *
 * @author Samchon
 */
export interface IHumanFaceHairContact {
  /** Required free distance of every station, in metres. */
  clearance: number;

  /** The layer's sampling step: the longest chord that inherits the clearance. */
  step: number;

  /** Rounding allowance scaled to the root, length, step and clearance. */
  epsilon: number;

  /**
   * Closed-collider query at a point; repeating the last point reuses its hit.
   */
  sample: (
    p: IAutoMovieVector3,
  ) => ReturnType<ReturnType<typeof createAutoMovieSignedMeshQuery>>;

  /**
   * Unit outward direction from a sampled hit toward the point.
   */
  outward: (
    p: IAutoMovieVector3,
    hit: ReturnType<ReturnType<typeof createAutoMovieSignedMeshQuery>>,
  ) => IAutoMovieVector3;

  /**
   * Moves a point to exactly the clearance along the nearest feature, or refuses.
   */
  project: (p: IAutoMovieVector3) => IAutoMovieVector3;

  /**
   * Same-collider offset proposal; every query spends the caller's lock budget.
   */
  retract: (
    point: IAutoMovieVector3,
    offset: number,
    budget: IAutoMovieMeshQueryBudget,
  ) => IHumanFaceHairRetraction;
}

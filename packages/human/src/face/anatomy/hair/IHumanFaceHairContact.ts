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
 * @evidence contracts/common.md#principled-implementation Exposes the clearance together with the step that makes station clearance hold along every chord.
 * @evidence contracts/common.md#clear-and-simple-design Named members replace an anonymous return type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Projection and retraction refuse on non-convergence instead of returning an unproved point.
 * @evidence contracts/common.md#meaningful-documentation States the clearance composition, the chord guarantee and shared state.
 * @evidence contracts/modeling.md#spatial-conventions All lengths are current head-frame metres; normals are unit directions.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The integrator and mesher emit geometry.
 * @evidence contracts/modeling.md#shared-boundaries One collider and one clearance serve the integrator, strand projector and mesher.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical geometry only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived state, not a personal control.
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
   *
   * @evidence contracts/common.md#principled-implementation The same coordinates return the identical deterministic hit, so reuse changes no answer.
   * @evidence contracts/common.md#clear-and-simple-design One reader of the shared contact instance.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No cached hit is returned for different coordinates.
   * @evidence contracts/common.md#meaningful-documentation States the reader's input, output and frame.
   * @evidence contracts/modeling.md#spatial-conventions Points are current head-frame metres; directions are unit vectors.
   * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
   * @evidenceExclude contracts/modeling.md#emitted-geometry The integrator and mesher emit geometry.
   * @evidence contracts/modeling.md#shared-boundaries Reads the one closed collider shared by integrator, projector and mesher.
   * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical geometry only.
   * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Derived reader, not a personal control.
   */
  sample: (
    p: IAutoMovieVector3,
  ) => ReturnType<ReturnType<typeof createAutoMovieSignedMeshQuery>>;

  /**
   * Unit outward direction from a sampled hit toward the point.
   *
   * @evidence contracts/common.md#principled-implementation Points from the nearest feature to the point, flipped inside, or uses the feature normal at zero distance.
   * @evidence contracts/common.md#clear-and-simple-design One reader of the shared contact instance.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A zero-length direction refuses instead of returning an arbitrary normal.
   * @evidence contracts/common.md#meaningful-documentation States the reader's input, output and frame.
   * @evidence contracts/modeling.md#spatial-conventions Points are current head-frame metres; directions are unit vectors.
   * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
   * @evidenceExclude contracts/modeling.md#emitted-geometry The integrator and mesher emit geometry.
   * @evidence contracts/modeling.md#shared-boundaries Reads the one closed collider shared by integrator, projector and mesher.
   * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical geometry only.
   * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Derived reader, not a personal control.
   */
  outward: (
    p: IAutoMovieVector3,
    hit: ReturnType<ReturnType<typeof createAutoMovieSignedMeshQuery>>,
  ) => IAutoMovieVector3;

  /**
   * Moves a point to exactly the clearance along the nearest feature, or refuses.
   *
   * @evidence contracts/common.md#principled-implementation Repeats nearest-feature moves until the clearance holds, reusing a free witness only when the 1-Lipschitz bound proves it.
   * @evidence contracts/common.md#clear-and-simple-design One reader of the shared contact instance.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses after 64 moves instead of returning an uncleared point.
   * @evidence contracts/common.md#meaningful-documentation States the reader's input, output and frame.
   * @evidence contracts/modeling.md#spatial-conventions Points are current head-frame metres; directions are unit vectors.
   * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
   * @evidenceExclude contracts/modeling.md#emitted-geometry The integrator and mesher emit geometry.
   * @evidence contracts/modeling.md#shared-boundaries Reads the one closed collider shared by integrator, projector and mesher.
   * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical geometry only.
   * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Derived reader, not a personal control.
   */
  project: (p: IAutoMovieVector3) => IAutoMovieVector3;

  /**
   * Same-collider offset proposal; every query spends the caller's lock budget.
   *
   * @evidence contracts/common.md#principled-implementation Re-measures the proposed offset point before returning it.
   * @evidence contracts/common.md#clear-and-simple-design One reader of the shared contact instance.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses on budget exhaustion or non-convergence; the budget is never reset.
   * @evidence contracts/common.md#meaningful-documentation States the reader's input, output and frame.
   * @evidence contracts/modeling.md#spatial-conventions Points are current head-frame metres; directions are unit vectors.
   * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
   * @evidenceExclude contracts/modeling.md#emitted-geometry The integrator and mesher emit geometry.
   * @evidence contracts/modeling.md#shared-boundaries Reads the one closed collider shared by integrator, projector and mesher.
   * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical geometry only.
   * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Derived reader, not a personal control.
   */
  retract: (
    point: IAutoMovieVector3,
    offset: number,
    budget: IAutoMovieMeshQueryBudget,
  ) => IHumanFaceHairRetraction;
}

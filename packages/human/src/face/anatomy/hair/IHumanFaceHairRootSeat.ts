import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairRootReference } from "./IHumanFaceHairRootReference";

/**
 * One sampled root carried to the current face without changing its source reference.
 *
 * @evidence contracts/common.md#principled-implementation A generic sampled-root identity is paired with current barycentric position and shared-host outward normal in the head frame.
 * @evidence contracts/common.md#clear-and-simple-design seatHumanFaceHairRoots preserves the caller's root subtype while owning the two current vectors.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The shading normal convention does not move the collision surface or certify a biological follicle measurement.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish borrowed original root data from current owned metre coordinates and unit direction.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Seat allocation and interpolation occur in seatHumanFaceHairRoots, not this erased result type.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The seated root reference is shared while live coordinates are recomputed by its producer.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns returned seat vectors; original root lifetime remains with the root population.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootSeat<T extends IHumanFaceHairRootReference> {
  /** Original root identity and sampling data, retained as the caller's subtype. */
  root: T;

  /** Current barycentric root position, head-frame metres. */
  seated: IAutoMovieVector3;

  /** Current outward unit direction from the original face winding. */
  normal: IAutoMovieVector3;
}

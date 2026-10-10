import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairRootReference } from "./IHumanFaceHairRootReference";

/**
 * One sampled root carried to the current face without changing its source reference.
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

import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceRigidMotion } from "../structures/IAutoMovieHumanFaceRigidMotion";
import type { evaluateHumanFaceRest } from "./evaluateHumanFaceRest";

/** Owned native source stage before final source closure/contact and generated assemblies.
 *
 * @author Samchon
 */
export interface IHumanFaceNativePose {
  /** Owned performed source arrays after one native articulation/refinement pass. */
  posed: Map<string, number[]>;
  /** Shape-only identity before final replay/contact, with oral performance omitted. */
  shaped?: ReturnType<typeof evaluateHumanFaceRest>;
  /** Actual contact opening direction, without reading an absent incisor. */
  up?: IAutoMovieVector3;
  /** Actual source companion gain per closure weight, measured on the current lip aperture. */
  closureRatio: number;
  /** Existing source joint motions shared by native and generated attached parts. */
  motions?: ReadonlyMap<string, IAutoMovieHumanFaceRigidMotion>;
}

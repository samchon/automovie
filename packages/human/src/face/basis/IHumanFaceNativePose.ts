import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceRigidMotion } from "../structures/IAutoMovieHumanFaceRigidMotion";
import type { evaluateHumanFaceRest } from "./evaluateHumanFaceRest";

/** Owned native source stage before final source closure/contact and generated assemblies.
 *
 * @evidence contracts/common.md#principled-implementation createHumanFaceNativePose evaluates shared source rest identity, native articulation/refinement and closure companion; optional shape-only reference omits oral transient performance.
 * @evidence contracts/common.md#clear-and-simple-design Native arrays, reference state, opening up and joint maps travel together before final closure/contact/generated assembly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Closure measures actual lip aperture without reading an absent incisor; a native stage alone proves no final contact, normals or complete-model validity.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish performed arrays, optional shape-only identity, source closure ratio and shared joint-motion ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This result implements no evaluation; native pose owners carry surface/refinement costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type schedules no work; reference preparation borrows the exact existing native stage when supplied.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no external resource; build-owned arrays/maps live with reference/final evaluation.
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

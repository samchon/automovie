import { AutoMovieHumanoidBone } from "@automovie/interface";
import { IAutoMovieRestFrame } from "./IAutoMovieRestFrame";

/**
 * Rest frames for the **canonical T-pose humanoid**, where they differ from the
 * identity. The shoulders sit at ~90° clinical abduction at rest, and the two
 * sides mirror the abduction sign (a first pass: flexion/twist reconciliation
 * is future work). Bones omitted need no shift (legs/spine rest at clinical
 * neutral).
 *
 * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rest-bind-deformation Declares the non-identity rest conversion for canonical humanoid shoulder bones.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-skin-rigid-morph-deformation Preserves the T-pose basis needed to interpret shoulder articulation consistently.
 * @author Samchon
 */
export const HUMANOID_REST_FRAME: Partial<
  Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>
> = {
  leftUpperArm: { abduction: { sign: 1, neutral: 90 } },
  rightUpperArm: { abduction: { sign: -1, neutral: 90 } },
};

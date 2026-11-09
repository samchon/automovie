import type { IAutoMovieSkeleton } from "@automovie/interface";

import type { IAutoMovieExternalMotionBoneMapping } from "./IAutoMovieExternalMotionBoneMapping";

/**
 * Retarget use declares the source rig, the mapping and the target identity, so the engine pass that later retargets the take guesses none of them.
 *
 * @evidence contracts/development/design.md#principled-representation Retargeting additionally needs a root translation multiplier and a target identity, the two inputs a skeleton-to-skeleton transfer cannot derive from the source bytes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The retarget arm is the native arm plus exactly those two fields, so the union's narrowing exposes them only where they apply.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Ingest validates the multiplier and target spelling but never resolves the target or picks a default scale, leaving both explicit for the engine pass.
 * @evidence contracts/development/common.md#meaningful-documentation The added properties state the finite-positive range of the multiplier and that the target is resolved after ingest.
 */
export interface IAutoMovieExternalMotionRetargetDecision {
  /** Mode discriminator. */
  mode: "retarget";

  /** Inspected take id such as `clip_0`. */
  take: string;

  /** Source skeleton with a non-blank id, unique bones including `hips`, and, for every mapped bone, the parent and rest the inspected hierarchy implies with exact number equality. */
  sourceRig: IAutoMovieSkeleton;

  /** Non-empty node-to-bone mapping that covers every node the take animates; ingest never derives it from names. */
  mapping: IAutoMovieExternalMotionBoneMapping[];

  /** Multiplier for source root translation; finite and positive. */
  translationScale: number;

  /** Non-blank target rig or actor identity, resolved after ingest. */
  target: string;
}

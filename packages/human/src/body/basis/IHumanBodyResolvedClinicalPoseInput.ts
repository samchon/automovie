import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type { IAutoMovieJointPose } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { resolveHumanBodySkeleton } from "./resolveHumanBodySkeleton";

/**
 * Inputs of `readHumanBodyResolvedClinicalPose`.
 *
 * The rig and the resolved bones are the same pose resolution's shaped rest
 * frames and final frames after the pelvis turn; the authored rows and the
 * pelvifemoral tilt are what that resolution consumed. Every input is read
 * only.
 *
 * @evidence contracts/common.md#principled-implementation Clinical coordinates are read from the same resolution's rest and final frames, never recomputed from a second pose path.
 * @evidence contracts/common.md#clear-and-simple-design One named record replaces the reader's anonymous input type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No caller value is changed and no range is judged here.
 * @evidence contracts/common.md#meaningful-documentation States each field's origin in the pose resolution, the tilt's unit and sign, and read-only use.
 * @evidence contracts/modeling.md#spatial-conventions Frames are the rig's metre Y-up body frame; authored angles and the tilt are degrees.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The input names existing bones and defines no part.
 * @evidence contracts/modeling.md#parameter-channels The authored rows are the named clinical motion coordinates the reader returns.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The input emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The input builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The pose resolver and editor observe the posed body.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The input carries source-rig frames, not measured joint capacity.
 * @evidenceExclude contracts/anatomy.md#permitted-range Ranges are judged by the pose resolver, not this input.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Internal pose state, not a person-authoring input.
 * @author Samchon
 */
export interface IHumanBodyResolvedClinicalPoseInput {
  /** Shaped rig of the pose: skeleton, rest frames and clinical axes. */
  rig: ReturnType<typeof resolveHumanBodySkeleton>;

  /** Final resolved bones after the shoulder resolution and pelvis turn. */
  resolved: readonly IAutoMovieResolvedBone[];

  /** Compiled basis whose joints declare neutrals, signs and flexion landmarks. */
  basis: IAutoMovieHumanBodyBasis;

  /** Authored joint rows the resolution consumed. */
  pose: readonly IAutoMovieJointPose[];

  /** Posterior pelvifemoral tilt the pelvis turn applied, in degrees; zero for none. */
  tilt: number;
}

import type { IAutoMovieSkeleton } from "@automovie/interface";

import type { IAutoMovieExternalMotionBoneMapping } from "./IAutoMovieExternalMotionBoneMapping";

/**
 * Inputs copied after adoption's mapped-basis and retarget-field checks; the engine-owned retarget pass still admits source conversion and source-target compatibility.
 *
 * @evidence contracts/development/design.md#principled-representation Besides the copied rig and sorted mapping, the retarget handoff forwards the validated multiplier and target unchanged, which is all the engine retarget pass needs from ingest.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Its fields mirror the retarget decision minus the take id, so the receipt's take field is the single place the selected clip lives.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The documentation keeps source conversion and source-target compatibility as downstream checks rather than implying ingest performed them.
 * @evidence contracts/development/common.md#meaningful-documentation The property comments say which values were checked, finite-positive scale and non-blank target, and that the target is not resolved here.
 */
export interface IAutoMovieExternalMotionRetargetHandoff {
  /** Mode discriminator. */
  mode: "retarget";

  /** Deep copy of the decision's source rig, sharing nothing with it. */
  sourceRig: IAutoMovieSkeleton;

  /** Copy of the decision's mapping sorted by node id in code-unit order. */
  mapping: IAutoMovieExternalMotionBoneMapping[];

  /** The decision's multiplier, checked finite and positive. */
  translationScale: number;

  /** The decision's target identity, checked non-blank but not resolved. */
  target: string;
}

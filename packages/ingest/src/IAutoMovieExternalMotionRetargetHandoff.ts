import type { IAutoMovieSkeleton } from "@automovie/interface";

import type { IAutoMovieExternalMotionBoneMapping } from "./IAutoMovieExternalMotionBoneMapping";

/**
 * Inputs copied after adoption's mapped-basis and retarget-field checks; the engine-owned retarget pass still admits source conversion and source-target compatibility.
 *
 * @evidence contracts/common.md#principled-implementation Besides the copied rig and sorted mapping, the retarget handoff forwards the validated multiplier and target unchanged, which is all the engine retarget pass needs from ingest.
 * @evidence contracts/common.md#clear-and-simple-design Its fields mirror the retarget decision minus the take id, so the receipt's take field is the single place the selected clip lives.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The documentation keeps source conversion and source-target compatibility as downstream checks rather than implying ingest performed them.
 * @evidence contracts/common.md#meaningful-documentation The property comments say which values were checked, finite-positive scale and non-blank target, and that the target is not resolved here.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The retarget handoff is a data-only record that executes no code.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The retarget handoff coordinates no work between requests or consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Two scalars plus copies owned by the receipt; no handle or task.
 * @author Samchon
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

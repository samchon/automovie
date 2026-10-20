import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import type { IPreparedChainPlant } from "./IPreparedChainPlant";

/**
 * One target and bend-plane choice evaluated against prepared chain geometry.
 * Coordinates retain the resolved model metre frame; optional clinical axes
 * and rest frames are the same ones final FK and ROM evaluation consume.
 *
 * @evidence contracts/common.md#principled-implementation Pairs pose-invariant chain frames with one target and optional model-frame bend normal, while the same clinical axes/rest frames lower solved quaternions and reconstruct the clamped residual.
 * @evidence contracts/common.md#clear-and-simple-design Candidate-varying target and bend normal stay separate from prepared chain geometry, exposing which work can be shared during the bounded bend-plane search.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted bend normal selects the analytic two-bone default, not a fixture-specific pole; supplied mappings remain the caller's rig semantics rather than a solver compensation.
 * @evidence contracts/common.md#meaningful-documentation States resolved model-metre frame, optional bend-plane meaning and the requirement that clinical tables agree with final FK/ROM evaluation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This input runs no candidate solve; solvePreparedChainPlant owns analytic IK and clinical quaternion inversion under prepared domains.
 * @evidence contracts/performance.md#reuse-equivalent-work Multiple candidates borrow one prepared record while varying bend normal; semantic mappings must remain identical to preparation for that reuse to be valid.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The synchronous candidate input borrows a fixed-size prepared record and target; no results, resource handles or tasks are retained by the type.
 */
export interface ISolvePreparedChainPlantProps {
  /** Shared pose-invariant chain frames and effective clinical domains. */
  prepared: IPreparedChainPlant;

  /** Desired effector point in the resolved model metre frame. */
  target: IAutoMovieVector3;

  /** Caller clinical axes used for quaternion inversion and final FK. */
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

  /** Caller sign/neutral conversion used by the same semantic controls. */
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;

  /** Chosen model-frame bend-plane normal; omission uses the analytic default. */
  bendNormal?: IAutoMovieVector3;
}

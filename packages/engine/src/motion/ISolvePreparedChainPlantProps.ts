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
 * @evidence contracts/development/design.md#principled-representation Pairs pose-invariant chain frames with one target and optional model-frame bend normal, while the same clinical axes/rest frames lower solved quaternions and reconstruct the clamped residual.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Candidate-varying target and bend normal stay separate from prepared chain geometry, exposing which work can be shared during the bounded bend-plane search.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Omitted bend normal selects the analytic two-bone default, not a fixture-specific pole; supplied mappings remain the caller's rig semantics rather than a solver compensation.
 * @evidence contracts/development/common.md#meaningful-documentation States resolved model-metre frame, optional bend-plane meaning and the requirement that clinical tables agree with final FK/ROM evaluation.
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

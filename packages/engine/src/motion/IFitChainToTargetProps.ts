import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieSkeletonTopology } from "../kinematics/IAutoMovieSkeletonTopology";
import type { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import type { IAutoMoviePlantChain } from "./IAutoMoviePlantChain";

/**
 * Actual rig, target and shared semantic frames for a bounded contact fit.
 * The current pose retains its non-chain joints; a prior pose only ranks
 * equally accurate bend choices. The solver owns no replacement rig limits.
 *
 * @evidence contracts/development/design.md#principled-representation Supplies a reachable descendant two-bone chain, current pose and target in the same resolved model-metre frame; fitChainToTarget scores clamped FK residual under the rig's effective ROM and uses a prior pose only to rank equivalent residual buckets.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One input groups the rig, its pre-indexed topology and the shared clinical mappings so IK inversion, ROM and residual FK use the same semantics.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No replacement constraint or target offset is embedded in this input; missing or degenerate chain preparation leaves the current pose unchanged rather than synthesizing a rig.
 * @evidence contracts/development/common.md#meaningful-documentation States target frame, unchanged non-chain joints, no-improvement identity and continuity-only prior-pose meaning; the topology must belong to the unchanged supplied skeleton.
 */
export interface IFitChainToTargetProps {
  /** Rig whose ROM and rest transforms constrain the solve. */
  skeleton: IAutoMovieSkeleton;

  /** Current authored pose; returned unchanged when no candidate improves it. */
  pose: IAutoMoviePose;

  /** Ordered root, mid, and end-effector bones of one descendant chain. */
  chain: IAutoMoviePlantChain;

  /** Target position in the pose's resolved model-metre frame. */
  target: IAutoMovieVector3;

  /** Pre-indexed topology belonging to `skeleton`. */
  topology: IAutoMovieSkeletonTopology;

  /**
   * Optional clinical axes used consistently by IK, ROM, and FK, under any
   * axes the skeleton's bones declare.
   */
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

  /** Optional clinical rest frames used consistently by IK, ROM, and FK. */
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;

  /**
   * Prior corrected pose used only to stabilize equal-residual bend branches;
   * its root and non-chain joints do not replace the current pose. A hinged
   * chain's swivel prefers the candidate nearest it (degrees of joint turn
   * counted like degrees of effector error). It must be a grid-free reference,
   * such as the solution at a contact event, never the previous frame, so a
   * displayed pose stays a pure function of time.
   */
  referencePose?: IAutoMoviePose;

  /**
   * How much a degree of joint turn from `referencePose` counts in a hinged
   * chain's swivel choice, in degrees of effector error; 1 when omitted. A
   * caller approaching the reference's instant raises it continuously from
   * near 0 to 1, so the reference decides between two nearly tied swivels
   * before the approach reaches them without pulling the limb early on, and
   * the chosen swivel stays continuous in time. Only the swivel's continuous
   * cost reads it; must be finite and non-negative.
   */
  referenceWeight?: number;

  /**
   * A model-frame point the mid joint (a knee or an elbow) bends toward, the
   * pole vector of game-engine two-bone IK. Omitted, a hinged chain (elbow,
   * knee) keeps the side its posed hinge already bends toward, the
   * plane-preserving default of analytic two-bone IK, since world-down lies
   * almost along a standing leg and flips its knee between frames; another
   * chain bends toward world-down and searches bend planes by residual and
   * continuity.
   */
  bend?: IAutoMovieVector3;

  /**
   * The effector's model-frame rotation, as `resolvePose` reports world
   * rotations; omitted, the effector keeps the pose's own angles.
   */
  effectorRotation?: IAutoMovieQuaternion;
}

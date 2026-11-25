import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePose } from "../pose/IAutoMoviePose";
import type { IAutoMovieRestFrame } from "../pose/IAutoMovieRestFrame";
import type { IAutoMovieSkeletonTopology } from "../pose/IAutoMovieSkeletonTopology";
import type { IAutoMovieSwivelNear } from "../pose/IAutoMovieSwivelNear";
import type { IAutoMovieSwivelSeed } from "../pose/IAutoMovieSwivelSeed";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMoviePlantChain } from "./IAutoMoviePlantChain";

/**
 * Actual rig, target and shared semantic frames for a bounded contact fit. The
 * current pose retains its non-chain joints; a prior pose only ranks equally
 * accurate bend choices. The solver owns no replacement rig limits.
 */
export interface IAutoMovieFitChainToTargetProps {
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
   * Optional clinical axes used consistently by IK, ROM, and FK, under any axes
   * the skeleton's bones declare.
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
   * caller approaching the reference's instant raises it continuously from near
   * 0 to 1, so the reference decides between two nearly tied swivels before the
   * approach reaches them without pulling the limb early on, and the chosen
   * swivel stays continuous in time. Only the swivel's continuous cost reads
   * it; must be finite and non-negative.
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
   * A hinged chain's strain of a candidate, non-negative: the candidate's
   * bone-local root and mid rotations and the mid bone's world rotation. When
   * given, a hinged chain's swivels are ranked by task priority (Siciliano and
   * Slotine 1991): legality, then the effector's rotation error, two errors
   * within the joints' tolerance being one, then the turn from `referencePose`
   * when one is given, else this strain, so the elbow takes its place of least
   * strain among the swivels that turn the hand best (Tolani, Goswami and
   * Badler 2000: the elbow's place on its swivel circle chosen by a cost of the
   * joints), and `bend` is not read. The fit reports the value it chose by
   * (`IAutoMovieSeededChainFit.value`). Omitted, `bend` is the hint.
   */
  strain?: (
    upper: IAutoMovieQuaternion,
    lower: IAutoMovieQuaternion,
    lowerWorld: IAutoMovieQuaternion,
  ) => number;

  /**
   * Whether `bend` is the mid joint's place a completed elbow search chose for
   * this target (`AutoMovieMotionHumanBend.solve`), not merely a side to bend
   * toward: the fit then starts its local search at the swivel that puts the
   * mid joint there (the pole) and returns its legal result, sweeping only
   * where that is not legal, so the place is searched once. Absent, a hinted
   * fit with a requested rotation accepts its local start only where the
   * rotation is met and sweeps otherwise.
   */
  placed?: boolean;

  /**
   * The effector's model-frame rotation, as `resolvePose` reports world
   * rotations; omitted, the effector keeps the pose's own angles.
   */
  effectorRotation?: IAutoMovieQuaternion;

  /**
   * What a hinged chain must keep clear of beyond the rig's own ranges, such as
   * the body the limb belongs to: given a candidate's mid joint and end joint
   * in the pose's resolved model-metre frame, the degrees that candidate counts
   * as out of range, 0 when it is allowed and never negative. It adds to the
   * range of motion overshoot the swivel choice ranks first, so an obstructed
   * swivel loses to a clear one whatever the bend hint, the reference or the
   * effector's rotation prefer. Omitted, only the rig's ranges decide.
   */
  obstruction?: (mid: IAutoMovieVector3, end: IAutoMovieVector3) => number;

  /**
   * A hinged chain's fit of a nearby target to continue, its seed and the
   * tolerance its swivel is refined to (`IAutoMovieSwivelNear`), in place of
   * the sweep over every swivel; omitted, the swivel is swept. A caller reads a
   * seed from `fitSeededChainToTarget`.
   */
  near?: IAutoMovieSwivelNear;

  /**
   * A seed a caller holds for a swept (not continued) fit, the branch and
   * swivel it chose for a nearby target: never the answer by itself, only a
   * legal candidate whose exact score starts the bounded sweep's stop, kept
   * only where the sweep's own choice is legal and no worse than it, so the
   * answer is the sweep's either way. Ignored with `near`.
   */
  incumbent?: IAutoMovieSwivelSeed;
}

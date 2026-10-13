import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieJointRotationDomain } from "../kinematics/IAutoMovieJointRotationDomain";
import type { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";
import type { Quaternion } from "../math/Quaternion";
import type { IAutoMoviePlantChain } from "./IAutoMoviePlantChain";


/**
 * Pose-invariant chain frames and effective clinical domains prepared for one target.
 * The solver and residual reader share these same rest transforms and constraints;
 * offsets and endpoints use the resolved model metre frame.
 *
 * @evidence contracts/common.md#principled-implementation Captures articulation-free chain frames under the current parent pose plus root/mid effective clinical domains; local offsets and relative lower rotation let each clamped candidate's effector be resolved by two compositions.
 * @evidence contracts/common.md#clear-and-simple-design Separates pose-invariant preparation from candidate-specific target/bend choice so the inverse solve and residual scorer consume identical frames and constraints.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Domains come from the actual skeleton and shared defaults; this record has no alternate rig limits or copied measurement that overrides solved FK.
 * @evidence contracts/common.md#meaningful-documentation Describes articulation removal, current parent pose, model-metre coordinates, local offsets and the relative lower orientation required to reconstruct a candidate.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record itself performs no FK; preparation scans the current rig once and candidate evaluation uses these fixed fields.
 * @evidence contracts/performance.md#reuse-equivalent-work One prepared record is reused for all bend candidates of one unchanged pose/chain/mapping; it must be rebuilt when those inputs change and is not a cross-frame cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources One solve owns a fixed-size record referencing its chain/domains and resolved frames; releasing the solve releases it with no native or renderer resources.
 *
 * @author Samchon
 */
export interface IPreparedChainPlant {
  /** Ordered root, mid and effector identities from the caller's chain. */
  chain: IAutoMoviePlantChain;


  /** Effective root clinical domain used by inverse and final ROM scoring. */
  upperDomain: IAutoMovieJointRotationDomain;


  /** Effective mid clinical domain used by inverse and final ROM scoring. */
  lowerDomain: IAutoMovieJointRotationDomain;


  /** Root resolved with this chain's articulation removed, retaining its parent pose. */
  upper: IAutoMovieResolvedBone;


  /** Mid resolved in the same articulation-free chain and current parent pose. */
  lower: IAutoMovieResolvedBone;


  /** Current effector location of that chain, in model metres. */
  end: IAutoMovieVector3;


  /** Declared flexion axis rotated into the resolved model frame. */
  hinge: IAutoMovieVector3;


  /** Root-to-mid offset in the root's local frame, metres. */
  lowerOffset: IAutoMovieVector3;


  /** Mid orientation relative to the root before the candidate articulation. */
  lowerRotation: ReturnType<typeof Quaternion.identity>;


  /** Mid-to-effector offset in the mid's local frame, metres. */
  effectorOffset: IAutoMovieVector3;
}

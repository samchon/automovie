import {
  AutoMovieHumanoidBone,
  IAutoMovieBody,
  IAutoMovieCapsuleProxy,
  IAutoMovieMotion,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { IAutoMovieJointAxes } from "../kinematics/IAutoMovieJointAxes";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";

/**
 * Supply a rig, motion and capsule proxies for sampled inter-body collision inspection.
 *
 * @evidence contracts/common.md#principled-implementation Resolved motion joints provide proxy endpoints in the caller's shared coordinate frame; node labels emitted events and does not itself apply scene placement. Proxy admission precedes sampling.
 * @evidence contracts/common.md#clear-and-simple-design Actor inputs keep motion/rig identity, optional axis/rest remaps and physical response facts explicit instead of looking them up through a scene registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null body uses the check's declared mass/restitution defaults rather than measured body properties; proxy geometry is an authored volume approximation, not a mesh collision certificate.
 * @evidence contracts/common.md#meaningful-documentation Documents borrowed rig/motion/proxies, label-only node, optional remaps and null-body response meaning.
 * @evidence contracts/performance.md#efficient-algorithms The record is borrowed data; detection samples both actors' FK maps and scans all cross-actor proxy pairs, retaining sampled maps during the solve.
 * @evidence contracts/performance.md#reuse-equivalent-work The detector reuses each sampled actor map across capsule pairs; changed motion, rig or remaps require a fresh inspection rather than a type-level cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns all actor inputs, while the detector's maps are call-local; the actor contract owns no scene node, solver task or renderer handle.
 * @author Samchon
 */
export interface IAutoMovieCollisionActor {
  /** Scene node id, used to label emitted interaction events. */
  node: string;

  /** Rig for forward kinematics. */
  skeleton: IAutoMovieSkeleton;

  /** Motion clip to sample. */
  motion: IAutoMovieMotion;

  /** Capsule proxies over this actor's bones. */
  capsules: readonly IAutoMovieCapsuleProxy[];

  /** Physical body (mass, restitution). `null` → default mass. */
  body: IAutoMovieBody | null;

  /** Optional clinical-axis remap. */
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

  /** Optional rest-frame remap. */
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
}

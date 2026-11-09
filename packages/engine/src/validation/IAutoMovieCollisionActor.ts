import {
  AutoMovieHumanoidBone,
  IAutoMovieBody,
  IAutoMovieCapsuleProxy,
  IAutoMovieJointAxes,
  IAutoMovieMotion,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";

/**
 * Supply a rig, motion and capsule proxies for sampled inter-body collision inspection.
 *
 * @evidence contracts/development/design.md#principled-representation Resolved motion joints provide proxy endpoints in the caller's shared coordinate frame; node labels emitted events and does not itself apply scene placement. Proxy admission precedes sampling.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Actor inputs keep motion/rig identity, optional axis/rest remaps and physical response facts explicit instead of looking them up through a scene registry.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Null body uses the check's declared mass/restitution defaults rather than measured body properties; proxy geometry is an authored volume approximation, not a mesh collision certificate.
 * @evidence contracts/development/common.md#meaningful-documentation Documents borrowed rig/motion/proxies, label-only node, optional remaps and null-body response meaning.
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

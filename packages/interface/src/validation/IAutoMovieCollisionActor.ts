import type { IAutoMovieBody } from "../model/IAutoMovieBody";
import type { IAutoMovieMotion } from "../motion/IAutoMovieMotion";
import type { IAutoMovieRestFrame } from "../pose/IAutoMovieRestFrame";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieCapsuleProxy } from "./IAutoMovieCapsuleProxy";

/**
 * Supply a rig, motion and capsule proxies for sampled inter-body collision
 * inspection.
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

  /**
   * Authored physical body; null permits contact observations but a requested
   * response requires an explicit finite positive mass and finite restitution
   * in [0,1].
   */
  body: IAutoMovieBody | null;

  /** Optional clinical-axis remap. */
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

  /** Optional rest-frame remap. */
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
}

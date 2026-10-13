import {
  AutoMovieHumanoidBone,
  IAutoMovieBody,
  IAutoMovieMotion,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { IAutoMovieJointAxes } from "../kinematics";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { IAutoMovieCapsuleProxy } from "./validateCapsule";

/**
 * One actor in an inter-body collision test: its rig, its motion, the capsule
 * proxies that stand in for its volume, and its physical body (mass etc.,
 * #595): `null` bodies fall back to a default human mass. `node` labels it in
 * emitted events. Each capsule's endpoints must be two distinct bones of
 * `skeleton` with a positive radius; {@link detectBodyCollision} validates this
 * itself (a malformed capsule is an error, returned before sampling) rather
 * than trusting an upstream pass.
 *
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

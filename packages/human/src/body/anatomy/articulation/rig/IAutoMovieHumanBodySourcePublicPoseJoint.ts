import type {
  IAutoMovieJointAxes,
  IAutoMovieRestFrame,
} from "@automovie/engine";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanBodyBoneWorldRest } from "../../../structures/rig/IAutoMovieHumanBodyBoneWorldRest";
import type { IAutoMovieHumanBodySourceJointAxis } from "./IAutoMovieHumanBodySourceJointAxis";
import type { IAutoMovieHumanBodySourceProjection } from "./IAutoMovieHumanBodySourceProjection";

/** Existing public clinical-coordinate conversion evaluated inside the single anatomical graph. */
export interface IAutoMovieHumanBodySourcePublicPoseJoint {
  /** Uses the existing public clinical conversion rather than authored intrinsic source axes. */
  kind: "public-pose";

  /** Actual public basis goal identity, with source registration separately witnessed. */
  bone: AutoMovieHumanoidBone;

  /** Explicit source-supported public coordinates; zero on an absent axis is unsupported too. */
  supportedAxes: readonly ("flexion" | "abduction" | "twist")[];

  /** Actual basis axes, including proximal/distal twist order; not generic Euler axes. */
  axes: IAutoMovieJointAxes;

  /** Actual shaped clinical neutral/sign convention consumed by jointToQuaternion. */
  restFrame: IAutoMovieRestFrame;

  /** Optional source-local clinical conversion reference when this bone drives part of a public frame emitted by another node, such as ulna flexion/radius twist. */
  reference?: IAutoMovieHumanBodySourceProjection;

  /** Independent source coordinates as an alternative to authored public pose on this node; simultaneous authorities refuse. */
  localAxes?: readonly IAutoMovieHumanBodySourceJointAxis[];

  /** Actual source local joint frame paired with localAxes; preserves source pivots/directions independently of the public clinical conversion reference. */
  localFrame?: IAutoMovieHumanBodyBoneWorldRest;
}

import type {
  IAutoMovieJointAxes,
  IAutoMovieRestFrame,
} from "@automovie/engine";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanBodyBoneWorldRest } from "../../../structures/rig/IAutoMovieHumanBodyBoneWorldRest";
import type { IAutoMovieHumanBodySourceJointAxis } from "./IAutoMovieHumanBodySourceJointAxis";
import type { IAutoMovieHumanBodySourceProjection } from "./IAutoMovieHumanBodySourceProjection";

/**
 * Existing public clinical-coordinate conversion evaluated inside the single anatomical graph.
 *
 * @evidence contracts/common.md#principled-implementation Existing clinical axes and shaped rest-frame signs convert public goals inside the anatomical graph, with an optional same-node conversion reference.
 * @evidence contracts/common.md#clear-and-simple-design The record exposes supported public axes and a paired local-frame/local-axis alternative to keep source pivots distinct from clinical conversion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Explicit unsupported axes refuse even at zero; alternate internal coordinates cannot silently coexist with a public goal authority.
 * @evidence contracts/common.md#meaningful-documentation Members document twist order, clinical neutral, reference use, required alternative pairing and simultaneous-authority refusal.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The public-pose joint schema supplies clinical conversion inputs without evaluating jointToQuaternion.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Alternative source axes describe separate authority rather than cached work interchangeable with clinical goals.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The public-pose record retains no clinical solver, derived quaternion array or cancellable work.
 * @author Samchon
 */
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

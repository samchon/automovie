import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { physicalHullFaces } from "../physics/physicalHullFaces";
import { physicalShapeSegmentDistance } from "../physics/physicalShapeSegmentDistance";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { clampJointToSkeleton } from "../rom/clampJointToSkeleton";
import { IAutoMovieResolvedBone } from "./IAutoMovieResolvedBone";
import { IAutoMovieSkeletonTopology } from "./IAutoMovieSkeletonTopology";
import { resolvePose } from "./resolvePose";

/**
 * Close articulated chains (fingers and thumb) around an object: each
 * joint, proximal first, flexes until a capsule of its chain first touches
 * the object's colliders or its flexion reaches the rig's range of motion,
 * and the next joint then continues from there.
 *
 * This is the closing rule of kinematic grasp execution in grasp planners and
 * game engines: GraspIt!'s auto-grasp closes every joint of a hand at a set
 * rate and stops the joints proximal to a link once that link touches the
 * object, while the distal ones keep closing (Miller and Allen 2004, IEEE
 * Robot. Autom. Mag. 11(4):110); Unity and Unreal hand interaction systems
 * rotate each finger bone until a sweep against the held object hits. Here
 * the joints of a chain close one at a time, proximal to distal, which is the
 * same stopping rule evaluated sequentially: joint `k` turns its phalanx and
 * every phalanx after it as a rigid unit, so it stops at the first contact of
 * any of them, and the joints after it close from that state.
 *
 * Each phalanx is a capsule of the chain's `radius` from its joint to the
 * next joint of the chain, the last one to `tip` (a point in the distal
 * bone's rest frame relative to its joint). The gap of a phalanx is the exact
 * signed distance from its segment to each collider less the radius: the
 * segment-to-segment distance for spheres and capsules
 * (`closestPointsBetweenSegments`), and for boxes the minimum of the box's
 * signed distance along the segment, a convex function of the segment
 * parameter, found by golden-section search to 1e-9 of the segment. Contact is
 * a gap of zero or less.
 *
 * Every joint's flexion is searched from its current value upward in steps
 * of `step` degrees, the first step whose gap is not positive is bracketed
 * and bisected 30 times, and the joint keeps the bisection's lower end, the
 * last angle with a positive gap, so a phalanx stops touching the collider
 * within the bisection's resolution and never inside it. A joint already in
 * contact does not move. A joint that meets nothing stops at the flexion the
 * skeleton's range of motion allows (`clampJointToSkeleton`), so the result
 * never needs a later clamp. Forward kinematics is the engine's `resolvePose`
 * with the same axes and rest frames, so the angles read the same everywhere.
 *
 * The search is deterministic: a fixed step, a fixed bisection count and a
 * fixed chain and joint order. A step larger than the thinnest part of an
 * object can step a phalanx past it; the default of 1 degree moves a 0.1 m
 * phalanx tip less than 2 mm.
 *
 * @param input The rig, the pose to curl, the chains and the colliders.
 * @returns The curled pose and each chain's final angles and gap.
 * @throws {Error} When a chain names a bone the pose cannot resolve, the
 *   radius or step is not positive, or a collider is malformed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the closing rule and its source, the phalanx capsules, the exact distances, the search with its stopping side, the range-of-motion cap, determinism and the step's resolution.
 * @evidence contracts/development/implementation.md#principled-implementation GraspIt!'s auto-grasp stopping rule (Miller and Allen 2004) evaluated proximal to distal, with exact segment distances and a bracket-then-bisect search on forward kinematics of the engine's own resolver.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over chains and joints sharing one gap function; distances and the box search are local helpers.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance counts a gap as contact: a joint stops on the positive side of the first non-positive gap, and an unreached object leaves the joint at its range limit with the positive gap reported.
 * @evidence contracts/development/implementation.md#efficient-algorithms Per joint at most range/step + 30 forward-kinematics evaluations, each linear in bones, times phalanges times colliders; run once per grasp, not per frame.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input; a caller reuses the result for every frame of a hold.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the returned pose and records belong to the caller.
 */
export function curlChainUntilContact(
  input: curlChainUntilContact.IInput,
): curlChainUntilContact.IResult {
  const step: number = input.step ?? 1;
  if (!(step > 0)) throw new Error("A curl step must be positive");
  for (const collider of input.colliders) validate(collider.shape);
  const joints: Map<AutoMovieHumanoidBone, IAutoMovieJointPose> = new Map(
    input.pose.joints.map(
      (
        j: IAutoMovieJointPose,
      ): [AutoMovieHumanoidBone, IAutoMovieJointPose] => [j.bone, j],
    ),
  );
  const pose = (): IAutoMoviePose => ({
    ...input.pose,
    joints: [...joints.values()],
  });
  const reports: curlChainUntilContact.IChainResult[] = [];

  for (const chain of input.chains) {
    if (!(chain.radius > 0))
      throw new Error("A curled chain's radius must be positive");
    const flexion: number[] = [];

    // The gap of the phalanges from the k-th onward under the current angles
    // with joint k at a trial flexion.
    const gap = (k: number, angle: number): number => {
      const bone: AutoMovieHumanoidBone = chain.bones[k]!;
      const previous: IAutoMovieJointPose | undefined = joints.get(bone);
      joints.set(bone, {
        bone,
        flexion: angle,
        abduction: previous?.abduction ?? 0,
        twist: previous?.twist ?? 0,
      });
      const resolved: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        new Map(
          resolvePose(
            pose(),
            input.skeleton,
            input.jointAxes,
            input.restFrames,
            input.topology,
          ).map(
            (
              r: IAutoMovieResolvedBone,
            ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [r.bone, r],
          ),
        );
      if (previous === undefined) joints.delete(bone);
      else joints.set(bone, previous);
      let least: number = Infinity;
      for (let i: number = k; i < chain.bones.length; i++) {
        const from: IAutoMovieResolvedBone | undefined = resolved.get(
          chain.bones[i]!,
        );
        if (from === undefined)
          throw new Error(
            `A curled chain needs the resolvable bone ${chain.bones[i]}`,
          );
        const next: AutoMovieHumanoidBone | undefined = chain.bones[i + 1];
        const to: IAutoMovieVector3 =
          next === undefined
            ? Vector3.add(
                from.worldPosition,
                Quaternion.rotateVector(from.worldRotation, chain.tip),
              )
            : (resolved.get(next)?.worldPosition ?? from.worldPosition);
        for (const collider of input.colliders)
          least = Math.min(
            least,
            physicalShapeSegmentDistance(
              collider.frame,
              collider.shape,
              from.worldPosition,
              to,
            ) - chain.radius,
          );
      }
      return least;
    };

    for (let k: number = 0; k < chain.bones.length; k++) {
      const bone: AutoMovieHumanoidBone = chain.bones[k]!;
      const current: IAutoMovieJointPose = joints.get(bone) ?? {
        bone,
        flexion: 0,
        abduction: 0,
        twist: 0,
      };
      const start: number = current.flexion ?? 0;
      // A bone without a declared range turns at most half a revolution, past
      // which a phalanx would fold back through its own parent.
      const limit: number = Math.min(
        start + 180,
        clampJointToSkeleton(
          { ...current, flexion: start + 180 },
          input.skeleton,
        ).flexion ?? start,
      );
      let angle: number = start;
      if (gap(k, start) > 0) {
        let lo: number = start;
        let hi: number | undefined;
        for (
          let a: number = Math.min(limit, start + step);
          ;
          a = Math.min(limit, a + step)
        ) {
          if (gap(k, a) <= 0) {
            hi = a;
            break;
          }
          lo = a;
          if (a >= limit) break;
        }
        if (hi !== undefined)
          for (let i: number = 0; i < 30; i++) {
            const mid: number = (lo + hi) / 2;
            if (gap(k, mid) <= 0) hi = mid;
            else lo = mid;
          }
        angle = lo;
      }
      joints.set(bone, { ...current, bone, flexion: angle });
      flexion.push(angle);
    }
    const final: number = gap(0, joints.get(chain.bones[0]!)!.flexion ?? 0);
    reports.push({ bones: chain.bones, flexion, gap: final });
  }
  return { pose: pose(), chains: reports };
}

/**
 * Companion types of {@link curlChainUntilContact}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member's frame and unit.
 * @evidence contracts/development/design.md#principled-representation Chains of rig bones with a tip and a radius, world-placed physical shapes, and per-chain angles and gaps in degrees and metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What a grasping consumer passes and reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the physical profile's shape union and the resolver's axes and rest frames.
 */
export namespace curlChainUntilContact {
  /** The curl request. */
  export interface IInput {
    /** The rig, whose range of motion caps every flexion. */
    skeleton: IAutoMovieSkeleton;

    /** The pose to curl; only the chains' flexions change. */
    pose: IAutoMoviePose;

    /** Chains in closing order, each proximal to distal. */
    chains: readonly IChain[];

    /** The object's colliders, placed in the pose's world frame. */
    colliders: readonly ICollider[];

    /** Search step, degrees; 1 when absent. */
    step?: number;

    /** Clinical axes, as `resolvePose` takes them. */
    jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

    /** Clinical rest frames, as `resolvePose` takes them. */
    restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;

    /** Topology of the same skeleton, reused across evaluations. */
    topology?: IAutoMovieSkeletonTopology;
  }

  /** One closing chain, a digit. */
  export interface IChain {
    /** Its bones from proximal to distal, each the parent of the next. */
    bones: readonly AutoMovieHumanoidBone[];

    /** The distal phalanx's end in the last bone's rest frame relative to its joint, metres. */
    tip: IAutoMovieVector3;

    /** The phalanges' capsule radius, metres; positive. */
    radius: number;
  }

  /** One collider of the object, in world metres. */
  export interface ICollider {
    /** The shape; its own `transform` is relative to `frame`. */
    shape: P.IShape;

    /** The shape owner's world frame. */
    frame: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion };
  }

  /** The curl. */
  export interface IResult {
    /** The pose with every chain closed. */
    pose: IAutoMoviePose;

    /** Each chain's outcome, in input order. */
    chains: IChainResult[];
  }

  /** One chain's outcome. */
  export interface IChainResult {
    /** Its bones. */
    bones: readonly AutoMovieHumanoidBone[];

    /** Each joint's final flexion, degrees. */
    flexion: number[];

    /** The least gap of any of its phalanges to the object, metres: about zero when it touches, positive when the range of motion stopped it first. */
    gap: number;
  }
}

/** Refuse a shape whose dimensions cannot give a distance. */
function validate(shape: P.IShape): void {
  let ok: boolean;
  if (shape.kind === "sphere") ok = shape.radius > 0;
  else if (shape.kind === "capsule")
    ok = shape.radius > 0 && shape.halfLength >= 0;
  else if (shape.kind === "box")
    ok =
      shape.halfExtents.x > 0 &&
      shape.halfExtents.y > 0 &&
      shape.halfExtents.z > 0;
  else if (shape.kind === "hull")
    ok = physicalHullFaces(shape.points).faces.length >= 4;
  else {
    shape satisfies never;
    ok = false;
  }
  if (!ok)
    throw new Error(`A collider ${shape.id} has non-positive dimensions`);
}

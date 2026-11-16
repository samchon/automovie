import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieJointRotationDomain,
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  clampJointToSkeleton,
  decomposeJointRotation,
  getConstraint,
  skeletonJointAxes,
  swingTwistRange,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanHand } from "./HumanHand";
import type { IHumanPosture } from "./IHumanPosture";
import { poseBones } from "./poseBones";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import type { prepareHumanPostureProjection } from "./prepareHumanPostureProjection";
import { resolveHumanPosture } from "./resolveHumanPosture";

/**
 * A hand held at a world attitude on the arm as it stands: what a carried or
 * lifted object's attitude asks of the hand.
 *
 * The upper arm stays as the posture places it. The wrist takes the asked
 * rotation first: its local turn is the forearm's world rotation and the
 * hand's rest undone from it, read back as clinical angles on the chart
 * inside the wrist's range and clamped to it (the engine's decomposition and
 * clamp, the last step of every limb fit). The wrist has no turn about the
 * forearm's length, so what the clamp leaves of that turn, the twist of the
 * residual about the forearm's axis (a swing-twist split), is added to the
 * forearm's own twist, clamped to its range, and the wrist is solved again
 * on the turned forearm. The forearm moves only by that residual, from its
 * current twist: the engine's distal-twist split hands the forearm a share
 * of the whole rotation from its rest instead, and a 14-degree swing asked
 * of a carried glass turned the forearm from -29 to its +90 end.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what stays, what moves first, what the forearm takes and why from its current twist.
 * @evidence contracts/development/design.md#principled-representation An attitude is a world rotation of the hand; the arm as placed is the frame it is solved in.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One solve, read by the arm's carry and by a pick-up's lift, so both hold an object's attitude the same way.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The decomposition and the clamps are the engine's; no angle is set past the rig's range.
 */
export namespace HumanHandAttitude {
  /**
   * The posture with the arm written as joints, the hand turned to a world
   * rotation where the arm stands: the wrist first, the forearm's twist by
   * what the wrist cannot turn about the forearm's length.
   * The body's rig and canonical mappings remain unchanged during this
   * synchronous solve; a later call prepares their current values anew.
   *
   * @param body The body.
   * @param posture The posture; the arm is placed by its joints or its goal.
   * @param side The hand.
   * @param rotation The hand's world rotation asked.
   * @param source Optional exact FK reader or lazy supplier borrowed only during this synchronous solve.
   * @param projection Genuine unchanged-body operation projection, borrowed only by actual canonical reads.
   * @returns The posture with that arm's joints set and its goal removed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States inputs, numerical solve order, returned posture, unchanged-rig operation boundary and current-value preparation on a later call.
   * @evidence contracts/development/implementation.md#principled-implementation The wrist's local rotation decomposed on its chart inside its range and clamped; the residual's twist about the forearm's axis, converted to the forearm's clinical twist by its rate read off the rig, added to the current twist.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A wrist solve, one twist share and a second wrist solve.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Both joints are clamped by the rig's range; what neither can turn stays a residual, never reported as reached.
   * @evidence contracts/development/implementation.md#efficient-algorithms Initial placement retains the complete coupled solve. Up to three later wrist/forearm observations request only their chain frames: the shared selector can omit independent unobserved world goals, falling back fully for unsupported coupling. Ordered authored admission remains complete; one reader and prepared wrist metadata avoid repeated same-valued FK/rig math, without a measured speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One held invocation owns or synchronously borrows exact FK plus its parent's genuine same-body ROM metadata. Every canonical read still projects all actual authored joints, and unknown projections fall back cold. Forearm/hand observations retain proven dependency closure; fixed wrist metadata alone is shared while each residual/decomposition/clamp remains actual.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One local lazy FK getter owns O(B) successful scalar snapshots, and one wrist reader borrows fixed rig metadata plus its rest inverse/clamp closure until return or throw. Neither reader enters the returned posture, a plan, body memory or callback; fresh joints/tuples retain their existing output ownership.
   */
  export function held(
    body: IHumanBody,
    posture: IHumanPosture,
    side: HumanHand.Side,
    rotation: IAutoMovieQuaternion,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IHumanPosture {
    const upper: AutoMovieHumanoidBone = `${side}UpperArm`;
    const lower: AutoMovieHumanoidBone = `${side}LowerArm`;
    const hand: AutoMovieHumanoidBone = `${side}Hand`;
    const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([upper, lower, hand]);
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(source);
    const pose: IAutoMoviePose = resolveHumanPosture.seeded(
      body,
      posture,
      undefined,
      undefined,
      resolution,
      undefined,
      projection,
    ).pose;
    const read: (bone: AutoMovieHumanoidBone) => [number, number, number] = (
      bone: AutoMovieHumanoidBone,
    ): [number, number, number] => {
      const joint: IAutoMovieJointPose | undefined = pose.joints.find(
        (j: IAutoMovieJointPose): boolean => j.bone === bone,
      );
      return [joint?.flexion ?? 0, joint?.abduction ?? 0, joint?.twist ?? 0];
    };
    const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
    delete limbs[`${side}Arm`];
    const written: (
      forearm: readonly [number, number, number],
      wrist: readonly [number, number, number],
    ) => IHumanPosture = (
      forearm: readonly [number, number, number],
      wrist: readonly [number, number, number],
    ): IHumanPosture => ({
      ...posture,
      joints: {
        ...posture.joints,
        [upper]: read(upper),
        [lower]: forearm,
        [hand]: wrist,
      },
      limbs,
    });
    const bones: (
      at: IHumanPosture,
    ) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = (
      at: IHumanPosture,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
      const pose: IAutoMoviePose = resolveHumanPosture.seeded(
        body,
        at,
        undefined,
        undefined,
        resolution,
        requested,
        projection,
      ).pose;
      return poseBones(body, pose, resolution(), requested);
    };
    const readWrist: ReturnType<typeof wrist> = wrist(body, hand);
    const forearm: [number, number, number] = read(lower);
    const first: [number, number, number] = readWrist(
      poseBones(body, pose, resolution(), requested).get(lower)!.worldRotation,
      rotation,
    );

    // What the wrist leaves of the turn about the forearm's length.
    const shown: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = bones(
      written(forearm, first),
    );
    const along: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(
        shown.get(hand)!.worldPosition,
        shown.get(lower)!.worldPosition,
      ),
    );
    const left: number = twist(
      Quaternion.multiply(
        rotation,
        Quaternion.inverse(shown.get(hand)!.worldRotation),
      ),
      along,
    );
    if (!(Math.abs(left) > 1e-3)) return written(forearm, first);

    // The forearm's clinical twist per degree about its axis, read off the
    // rig, and the forearm turned by the residual, clamped to its range.
    const nudged: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = bones(
      written([forearm[0], forearm[1], forearm[2] + 1], first),
    );
    const rate: number = twist(
      Quaternion.multiply(
        nudged.get(hand)!.worldRotation,
        Quaternion.inverse(shown.get(hand)!.worldRotation),
      ),
      along,
    );
    if (!(Math.abs(rate) > 1e-6)) return written(forearm, first);
    const turned: IAutoMovieJointPose = clampJointToSkeleton(
      {
        bone: lower,
        flexion: forearm[0],
        abduction: forearm[1],
        twist: forearm[2] + left / rate,
      },
      body.skeleton,
    );
    const next: [number, number, number] = [
      forearm[0],
      forearm[1],
      turned.twist ?? forearm[2],
    ];
    return written(
      next,
      readWrist(
        bones(written(next, first)).get(lower)!.worldRotation,
        rotation,
      ),
    );
  }
}

/**
 * One held call's lazy wrist solve. First use keeps rest/local-quaternion,
 * axes, domain, decomposition and clamp admission in their original order;
 * the second wrist solve reuses only that unchanged rig metadata. The local
 * quaternion and decompose-then-clamp still run on every incoming attitude,
 * with first-bone rest/constraint and last-declared axes precedence.
 */
function wrist(
  body: IHumanBody,
  hand: AutoMovieHumanoidBone,
): (
  forearm: IAutoMovieQuaternion,
  rotation: IAutoMovieQuaternion,
) => [number, number, number] {
  let found: IAutoMovieBone | undefined;
  let inverse: IAutoMovieQuaternion | undefined;
  let axes:
    | Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>
    | undefined;
  let domain: IAutoMovieJointRotationDomain | undefined;
  let clamp: ((joint: IAutoMovieJointPose) => IAutoMovieJointPose) | undefined;
  return (
    forearm: IAutoMovieQuaternion,
    rotation: IAutoMovieQuaternion,
  ): [number, number, number] => {
    if (inverse === undefined) {
      found = body.skeleton.bones.find(
        (bone: IAutoMovieBone): boolean => bone.bone === hand,
      );
      inverse = Quaternion.inverse(
        found?.rest.rotation ?? Quaternion.identity(),
      );
    }
    const local: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(
        inverse,
        Quaternion.multiply(Quaternion.inverse(forearm), rotation),
      ),
    );
    axes ??= skeletonJointAxes(body.skeleton, HUMANOID_JOINT_AXES);
    domain ??= {
      bone: hand,
      constraint: getConstraint(hand, found?.constraint ?? null),
    };
    const angles: ReturnType<typeof decomposeJointRotation> =
      decomposeJointRotation(
        local,
        axes[hand],
        HUMANOID_REST_FRAME[hand],
        domain,
      );
    clamp ??= clampJointToSkeleton.resolved(
      hand,
      found,
      (): swingTwistRange.IJoint | undefined =>
        domain!.constraint === null ||
        domain!.constraint.swingTwist === undefined ||
        domain!.constraint.swingTwist === null
          ? undefined
          : swingTwistRange.fromAxes(hand, axes![hand]),
    );
    const joint: IAutoMovieJointPose = clamp({
      bone: hand,
      flexion: angles.flexion,
      abduction: angles.abduction,
      twist: angles.twist,
    });
    return [joint.flexion ?? 0, joint.abduction ?? 0, joint.twist ?? 0];
  };
}

/** The turn of a rotation about a unit axis, degrees in [-180, 180]: the twist of its swing-twist split, retaining atan2's signed endpoints. */
function twist(q: IAutoMovieQuaternion, axis: IAutoMovieVector3): number {
  const n: IAutoMovieQuaternion = Quaternion.normalize(q);
  const sign: number = n.w < 0 ? -1 : 1;
  return (
    (2 *
      Math.atan2(
        sign * (n.x * axis.x + n.y * axis.y + n.z * axis.z),
        sign * n.w,
      ) *
      180) /
    Math.PI
  );
}

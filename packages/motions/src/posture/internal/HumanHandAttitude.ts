import {
  AutoMovieEngineHumanoidJointAxes,
  AutoMovieEngineHumanoidRestFrame,
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
  AutoMovieEngineSwingTwistRange,
  AutoMovieEngineKinematics,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieJointRotationDomain,
  IAutoMovieJointRotationFrame,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { readHumanBone } from "../../body/internal/readHumanBone";
import { poseBones } from "./poseBones";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "./prepareHumanPostureProjection";
import { resolveHumanPosture } from "./resolveHumanPosture";

/*
 * A hand held at a world attitude on the arm as it stands: what a carried or
 * lifted object's attitude asks of the hand.
 *
 * The upper arm stays as the posture places it. The wrist takes the asked
 * rotation first: its local turn is the forearm's world rotation and the hand's
 * rest undone from it, read back as clinical angles on the chart inside the
 * wrist's range and clamped to it (the engine's decomposition and clamp, the
 * last step of every limb fit). The wrist has no turn about the forearm's
 * length, so what the clamp leaves of that turn, the twist of the residual
 * about the forearm's axis (a swing-twist split), is added to the forearm's own
 * twist, clamped to its range, and the wrist is solved again on the turned
 * forearm. The forearm moves only by that residual, from its current twist: the
 * engine's distal-twist split hands the forearm a share of the whole rotation
 * from its rest instead, and a 14-degree swing asked of a carried glass turned
 * the forearm from -29 to its +90 end.
 */
export namespace HumanHandAttitude {
  /*
   * The posture with the arm written as joints, the hand turned to a world
   * rotation where the arm stands: the wrist first, the forearm's twist by what
   * the wrist cannot turn about the forearm's length. The body's rig and
   * canonical mappings remain unchanged during this synchronous solve; a later
   * call prepares their current values anew.
   * Parameter body: The body.
   * Parameter posture: The posture; the arm is placed by its joints or its goal.
   * Parameter side: The hand.
   * Parameter rotation: The hand's world rotation asked.
   * Parameter source: Optional exact FK reader or lazy supplier borrowed only
   * during this synchronous solve.
   * Parameter projection: Genuine unchanged-body operation projection, borrowed
   * only by actual canonical reads.
   * Parameter preserveForearm: Keep a planned forearm's admitted twist. The
   * wrist may still take the part of the requested turn within its own range.
   * Returns: The posture with that arm's joints set and its goal removed.
   */
  export function held(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    rotation: IAutoMovieQuaternion,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
    preserveForearm: boolean = false,
  ): IAutoMovieMotionHumanPosture {
    const upper: AutoMovieHumanoidBone = `${side}UpperArm`;
    const lower: AutoMovieHumanoidBone = `${side}LowerArm`;
    const hand: AutoMovieHumanoidBone = `${side}Hand`;
    const requested: ReadonlySet<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>([upper, lower, hand]);
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
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };

    // An arm already written as joints keeps the shoulder it was written
    // with: only the forearm's twist and the wrist are this solve's. Read
    // back off the resolved pose, a planned arm's shoulder came out as
    // another reading of the three angles, and the frames before a hold
    // (where the attitude is held) showed the elbow 105 mm from where the
    // hold's own first frame (the plan's arm as written) shows it.
    const authored: readonly [number, number, number] | undefined =
      limbs[`${side}Arm`] === undefined ? posture.joints[upper] : undefined;
    delete limbs[`${side}Arm`];
    const written: (
      forearm: readonly [number, number, number],
      wrist: readonly [number, number, number],
    ) => IAutoMovieMotionHumanPosture = (
      forearm: readonly [number, number, number],
      wrist: readonly [number, number, number],
    ): IAutoMovieMotionHumanPosture => ({
      ...posture,
      joints: {
        ...posture.joints,
        [upper]: authored ?? read(upper),
        [lower]: forearm,
        [hand]: wrist,
      },
      limbs,
    });
    const bones: (
      at: IAutoMovieMotionHumanPosture,
    ) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = (
      at: IAutoMovieMotionHumanPosture,
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
    if (preserveForearm) return written(forearm, first);

    // What the wrist leaves of the turn about the forearm's length.
    const shown: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = bones(
      written(forearm, first),
    );
    const along: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
      AutoMovieEngineVector3.subtract(
        shown.get(hand)!.worldPosition,
        shown.get(lower)!.worldPosition,
      ),
    );
    const left: number = twist(
      AutoMovieEngineQuaternion.multiply(
        rotation,
        AutoMovieEngineQuaternion.inverse(shown.get(hand)!.worldRotation),
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
      AutoMovieEngineQuaternion.multiply(
        nudged.get(hand)!.worldRotation,
        AutoMovieEngineQuaternion.inverse(shown.get(hand)!.worldRotation),
      ),
      along,
    );
    if (!(Math.abs(rate) > 1e-6)) return written(forearm, first);
    const turned: IAutoMovieJointPose = AutoMovieEngineKinematics.clampJointToSkeleton(
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

/*
 * One held call's lazy wrist solve. First use keeps rest/local-quaternion,
 * axes, domain, decomposition and clamp admission in their original order; the
 * second wrist solve reuses only that unchanged rig metadata. The local
 * quaternion and decompose-then-clamp still run on every incoming attitude,
 * with first-bone rest/constraint and last-declared axes precedence.
 */
function wrist(
  body: IAutoMovieMotionHumanBody,
  hand: AutoMovieHumanoidBone,
): (
  forearm: IAutoMovieQuaternion,
  rotation: IAutoMovieQuaternion,
) => [number, number, number] {
  // The hand's rest, axes, rotation domain and range clamp, prepared once.
  const found: IAutoMovieBone | undefined = readHumanBone(body, hand);
  const inverse: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(
    found?.rest.rotation ?? AutoMovieEngineQuaternion.identity(),
  );
  const axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> =
    AutoMovieEngineKinematics.skeletonJointAxes(body.skeleton, AutoMovieEngineHumanoidJointAxes);
  const domain: IAutoMovieJointRotationDomain = {
    bone: hand,
    constraint: AutoMovieEngineKinematics.getConstraint(hand, found?.constraint ?? null),
  };
  const clamp: (joint: IAutoMovieJointPose) => IAutoMovieJointPose =
    AutoMovieEngineKinematics.clampJointToSkeletonResolved(
      hand,
      found,
      (): IAutoMovieJointRotationFrame | undefined =>
        domain.constraint === null ||
        domain.constraint.swingTwist === undefined ||
        domain.constraint.swingTwist === null
          ? undefined
          : AutoMovieEngineSwingTwistRange.fromAxes(hand, axes[hand]),
    );
  return (
    forearm: IAutoMovieQuaternion,
    rotation: IAutoMovieQuaternion,
  ): [number, number, number] => {
    const local: IAutoMovieQuaternion = AutoMovieEngineQuaternion.normalize(
      AutoMovieEngineQuaternion.multiply(
        inverse,
        AutoMovieEngineQuaternion.multiply(AutoMovieEngineQuaternion.inverse(forearm), rotation),
      ),
    );
    const angles: ReturnType<typeof AutoMovieEngineKinematics.decomposeJointRotation> =
      AutoMovieEngineKinematics.decomposeJointRotation(
        local,
        axes[hand],
        AutoMovieEngineHumanoidRestFrame[hand],
        domain,
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

/*
 * The turn of a rotation about a unit axis, degrees in [-180, 180]: the twist
 * of its swing-twist split, retaining atan2's signed endpoints.
 */
function twist(q: IAutoMovieQuaternion, axis: IAutoMovieVector3): number {
  const n: IAutoMovieQuaternion = AutoMovieEngineQuaternion.normalize(q);
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

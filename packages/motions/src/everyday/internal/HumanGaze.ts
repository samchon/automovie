import {
  DEFAULT_HUMANOID_ROM,
  Quaternion,
  Vector3,
  AutoMovieEngineKinematics,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGaze,
  IAutoMovieMotionHumanLayer,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { HumanGazeLayer } from "./HumanGazeLayer";
import { blendGazeJoint } from "./blendGazeJoint";
import { readHumanGazeBones } from "./readHumanGazeBones";

/*
 * Gaze as a goal: the eyes' lines brought onto a target, with the eyes, the
 * head and neck and the trunk recruited in that order as the target lies
 * farther from where the body faces.
 *
 * Gaze shifts recruit the eyes first and the head only beyond a threshold:
 * Freedman (2008, Exp Brain Res 190:369) reviews head-unrestrained gaze shifts
 * in which the head contributes little below about 15 to 20 degrees and an
 * increasing share beyond; Hollands, Ziavra and Bronstein (2004, Exp Brain Res
 * 154:261) find that large turns recruit the eyes, head, trunk and feet in that
 * order. The split here keeps the final eye-in-head eccentricity at most `EYES`
 * (15 degrees) on each axis, gives the head and neck the remainder up to `HEAD`
 * (comfortable cervical share, the yaw after Bennett et al. 2002 and the pitch
 * provisional: 60 degrees of yaw, 40 down and 30 up, inside
 * `DEFAULT_HUMANOID_ROM`), and, when the trunk may join, gives the chest and
 * lumbar spine the yaw beyond that up to `TRUNK` (40 degrees, provisional,
 * inside their combined twist range), 60 % to the chest and 40 % to the spine.
 * What none of these can hold stays on the eyes, clamped to their range, so a
 * gaze too far behind the body is visibly short; turning the feet is the `look`
 * action's step-turn.
 *
 * The head and neck angles come from the engine's `AutoMovieEngineKinematics.gazeChainJoints`, which
 * splits one aim over the neck and the head inside their ranges; the eyes are
 * then solved exactly: each eye's direction to the target is read in its head's
 * frame by forward kinematics of the trunk and head, and turned into the eye's
 * twist (yaw) and flexion (pitch), which compose as twist then flexion in the
 * default joint basis (`jointToQuaternion`), so the eye's forward meets the
 * target exactly within the eye's range.
 *
 * Timing: the eyes move on the saccadic main sequence, duration `2.2 A + 21`
 * milliseconds for an amplitude of `A` degrees (Bahill, Clark and Stark 1975,
 * Math Biosci 24:191; Carpenter 1988), and the head and trunk on a minimum-jerk
 * profile of `0.15 + 0.004 A` seconds (provisional: head movements are slower
 * than saccades and lengthen with amplitude, Zangemeister and Stark 1981; the
 * coefficients are unmeasured). Because the eyes are re-solved against the
 * moving head on every frame, they hold the target while the head catches up,
 * as the vestibulo-ocular reflex does, and a moving target is pursued.
 */
export namespace HumanGaze {
  /*
   * Final eye-in-head eccentricity before the head joins, degrees (Freedman
   * 2008).
   */
  export const EYES: number = 15;

  /*
   * The head and neck's comfortable share, degrees: a yaw of 60, between the 54
   * and 68 degrees of cervical rotation measured in crossing a street and
   * reversing a car (Bennett, Schenk and Simmons 2002, J Spinal Disord Tech
   * 15:307; Bible et al. 2010, J Spinal Disord Tech 23:15, 13 to 57 degrees
   * over daily tasks); the 40 down and 30 up have no measured source
   * (provisional).
   */
  export const HEAD: Readonly<IHEADItem> = {
    yaw: 60,
    down: 40,
    up: 30,
  };

  /*
   * The trunk's share of yaw, degrees (provisional).
   */
  export const TRUNK: number = 40;
  /*
   * Split a gaze direction over the eyes, the head and the trunk.
   * Parameter yaw: Direction from the trunk's facing, degrees, positive to the
   * performer's left.
   * Parameter pitch: Direction from level, degrees, positive down.
   * Parameter recruit: Which segments may join; `auto` is `trunk`.
   * Returns: The split.
   */
  export function split(
    yaw: number,
    pitch: number,
    recruit: IAutoMovieMotionHumanGaze.Recruit = "auto",
  ): IAutoMovieMotionHumanGaze.ISplit {
    if (recruit === "eyes")
      return { eyes: { yaw, pitch }, head: { yaw: 0, pitch: 0 }, trunk: 0 };
    const [eyeYaw, headYaw]: [number, number] = splitShare(
      yaw,
      EYES,
      HEAD.yaw,
      HEAD.yaw,
    );
    const headPitch: number = splitShare(pitch, EYES, HEAD.down, HEAD.up)[1];
    const beyond: number = yaw - eyeYaw - headYaw;
    const trunk: number =
      recruit === "head"
        ? 0
        : Math.sign(beyond) * Math.min(Math.abs(beyond), TRUNK);
    return {
      eyes: { yaw: yaw - headYaw - trunk, pitch: pitch - headPitch },
      head: { yaw: headYaw, pitch: headPitch },
      trunk,
    };
  }

  /*
   * Seconds of a saccade of an amplitude (the main sequence, Bahill et al.
   * 1975).
   * Parameter amplitude: Degrees.
   * Returns: Seconds.
   */
  export function saccade(amplitude: number): number {
    return (2.2 * Math.abs(amplitude) + 21) / 1000;
  }

  /*
   * Seconds of a head or trunk turn of an amplitude (provisional).
   * Parameter amplitude: Degrees.
   * Returns: Seconds.
   */
  export function turn(amplitude: number): number {
    return 0.15 + 0.004 * Math.abs(amplitude);
  }

  /*
   * The direction of a world point from the eyes' midpoint, as yaw and pitch
   * about the posture's hips frame.
   * Parameter body: The body.
   * Parameter posture: The posture, without gaze.
   * Parameter point: The world point.
   * Parameter resolution: Optional exact FK reader or lazy supplier borrowed from
   * this synchronous evaluation.
   * Returns: Yaw (positive left) and pitch (positive down), degrees.
   */
  export function direction(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    point: IAutoMovieVector3,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IAutoMovieMotionHumanGaze.IDirectionResult {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      readHumanGazeBones(body, posture, "direction", undefined, resolution);
    const eyes: IAutoMovieVector3 = Vector3.scale(
      Vector3.add(
        bones.get("leftEye")!.worldPosition,
        bones.get("rightEye")!.worldPosition,
      ),
      0.5,
    );
    const hips: IAutoMovieQuaternion = bones.get("hips")!.worldRotation;
    const local: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(hips),
      Vector3.subtract(point, eyes),
    );
    return {
      yaw: (Math.atan2(local.x, local.z) * 180) / Math.PI,
      pitch:
        (Math.atan2(-local.y, Math.hypot(local.x, local.z)) * 180) / Math.PI,
    };
  }

  /*
   * The posture with its gaze on a point: trunk and head blended toward their
   * shares by `weights`, then each eye solved exactly against the head it rides
   * and blended by its own weight.
   * Parameter body: The body.
   * Parameter posture: The posture without gaze.
   * Parameter point: The world point.
   * Parameter recruit: Which segments may join.
   * Parameter weights: How far each part has moved toward its share, each in [0,
   * 1].
   * Parameter resolution: Optional exact workspace borrowed only within this
   * synchronous gaze evaluation.
   * Parameter towards: Direction already computed from these exact body, posture
   * and point inputs; computed here when absent.
   * Returns: The posture with the trunk, neck, head and eyes set; limb goals
   * unchanged.
   */
  export function aim(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    point: IAutoMovieVector3,
    recruit: IAutoMovieMotionHumanGaze.Recruit,
    weights: IAutoMovieMotionHumanGaze.IAimWeights,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    towards?: IAimTowards,
  ): IAutoMovieMotionHumanPosture {
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(resolution);
    const facingTarget: IAimFacingTarget =
      towards ?? direction(body, posture, point, read);
    const parts: IAutoMovieMotionHumanGaze.ISplit = split(
      facingTarget.yaw,
      facingTarget.pitch,
      recruit,
    );
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...posture.joints,
    };

    // Trunk: twist added to whatever the action holds, chest 60 %, spine 40 %.
    addGazeTwist(joints, "chest", 0.6 * parts.trunk * weights.trunk);
    addGazeTwist(joints, "spine", 0.4 * parts.trunk * weights.trunk);

    // Head and neck: the engine's range-aware split of one aim. The split
    // turns the head from where the neck and the head hold it at zero
    // angles, and a body's head at zero need not face where its pelvis
    // does (a carried head is pitched at rest and its standing posture
    // levels it). So the aim is given less what the head faces at zero, and
    // the head ends on its share of the target whatever the body's rest.
    const zeroed: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      readHumanGazeBones(
        body,
        posture,
        "head",
        {
          ...joints,
          neck: [0, 0, 0],
          head: [0, 0, 0],
        },
        read,
      );

    // Read the cervical share in the frame the head has at zero angles.
    const headFrame: IAutoMovieQuaternion = Quaternion.inverse(
      Quaternion.multiply(
        Quaternion.inverse(zeroed.get("hips")!.worldRotation),
        zeroed.get("head")!.worldRotation,
      ),
    );
    const headPitch: number = (parts.head.pitch * Math.PI) / 180;
    const headYaw: number = (parts.head.yaw * Math.PI) / 180;
    const cosine: number = Math.cos(headPitch);
    const facing: IAutoMovieVector3 = Quaternion.rotateVector(headFrame, {
      x: cosine * Math.sin(headYaw),
      y: -Math.sin(headPitch),
      z: cosine * Math.cos(headYaw),
    });
    const chain: IAutoMovieJointPose[] = AutoMovieEngineKinematics.prepareGazeChainJoints(body.skeleton)(
      (Math.atan2(-facing.y, Math.hypot(facing.x, facing.z)) * 180) / Math.PI,
      (Math.atan2(facing.x, facing.z) * 180) / Math.PI,
    );
    let neck: IAutoMovieJointPose | undefined;
    let head: IAutoMovieJointPose | undefined;
    for (const joint of chain) {
      if (joint.bone === "neck" && neck === undefined) neck = joint;
      if (joint.bone === "head" && head === undefined) head = joint;
    }
    blendGazeJoint(
      joints,
      "neck",
      neck?.flexion ?? 0,
      0,
      neck?.twist ?? 0,
      weights.head,
    );
    blendGazeJoint(
      joints,
      "head",
      head!.flexion ?? 0,
      0,
      head!.twist ?? 0,
      weights.head,
    );

    // Eyes: each solved exactly in its head's frame, clamped to its range in
    // the range table (`DEFAULT_HUMANOID_ROM`: its twist is the yaw, its
    // flexion the pitch).
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      readHumanGazeBones(body, posture, "eyes", joints, read);
    const headRotation: IAutoMovieQuaternion = Quaternion.inverse(
      bones.get("head")!.worldRotation,
    );
    for (const eye of ["leftEye", "rightEye"] as const) {
      const d: IAutoMovieVector3 = Vector3.normalize(
        Quaternion.rotateVector(
          headRotation,
          Vector3.subtract(point, bones.get(eye)!.worldPosition),
        ),
      );
      const range: IAutoMovieJointConstraint = DEFAULT_HUMANOID_ROM[eye]!;
      // A target behind the eye is sought on the side the gaze turns to,
      // so one crossing straight behind does not swing the eye between its
      // limits.
      let toward: number = (Math.atan2(d.x, d.z) * 180) / Math.PI;
      if (Math.abs(toward) > 90 && toward * facingTarget.yaw < 0)
        toward -= 360 * Math.sign(toward);
      const yaw: number = Math.max(
        range.twist!.min,
        Math.min(range.twist!.max, toward),
      );
      const pitch: number = Math.max(
        range.flexion!.min,
        Math.min(
          range.flexion!.max,
          (Math.asin(Math.max(-1, Math.min(1, -d.y))) * 180) / Math.PI,
        ),
      );
      blendGazeJoint(joints, eye, pitch, 0, yaw, weights.eyes);
    }
    return { ...posture, joints };
  }

  /*
   * A gaze layer: from `from` the eyes, head and trunk turn toward the target
   * on their own timings and track it; from `to` they return. A request that
   * begins while an earlier one still holds the gaze turns the parts on from
   * where that one has them, so the gaze moves from target to target without
   * passing through rest.
   * Parameter requests: The gazes, in time order; each one's `from` after the
   * previous one's `from`.
   * Parameter name: The layer's name; `gaze` when absent.
   * Returns: The layer.
   */
  export function layer(
    requests: readonly IAutoMovieMotionHumanGaze.ILayer[],
    name: string = "gaze",
  ): IAutoMovieMotionHumanLayer {
    return HumanGazeLayer(requests, name);
  }
}

/*
 * The record of `IAimFacingTarget`'s site.
 */
type IAimFacingTarget = { yaw: number; pitch: number };

/*
 * The record of `IAimTowards`'s site.
 */
type IAimTowards = { yaw: number; pitch: number };

/*
 * The record of `IHEADItem`'s site.
 */
type IHEADItem = { yaw: number; down: number; up: number };

/*
 * One gaze axis split: the first part's share up to `first` either way, then
 * the next part's up to its limit on that side.
 */
function splitShare(
  total: number,
  first: number,
  limitPositive: number,
  limitNegative: number,
): [number, number] {
  const lead: number = Math.sign(total) * Math.min(Math.abs(total), first);
  const rest: number = total - lead;
  const next: number =
    rest >= 0 ? Math.min(rest, limitPositive) : Math.max(rest, -limitNegative);
  return [lead, next];
}

/*
 * Add an axial twist to one joint, keeping its other two angles.
 */
function addGazeTwist(
  joints: IAutoMovieMotionHumanPosture["joints"],
  bone: AutoMovieHumanoidBone,
  twist: number,
): void {
  const base: readonly [number, number, number] = joints[bone] ?? ZERO;
  joints[bone] = [base[0], base[1], base[2] + twist];
}

/*
 * The angles of a bone the record holds none for.
 */
const ZERO: readonly [number, number, number] = [0, 0, 0];

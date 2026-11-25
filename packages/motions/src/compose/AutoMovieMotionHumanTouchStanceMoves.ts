import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRange,
  IAutoMovieMotionHumanRise,
  IAutoMovieMotionHumanTouchStance,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBoneGroups } from "../posture/HumanBoneGroups";
import { lowerHumanPosture } from "../posture/lowerHumanPosture";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanLeg } from "./AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanRange } from "./AutoMovieMotionHumanRange";
import type { AutoMovieMotionHumanReach } from "./AutoMovieMotionHumanReach";
import { AutoMovieMotionHumanRise } from "./AutoMovieMotionHumanRise";

/**
 * The posture moves of a touch stance
 * (`AutoMovieMotionHumanTouchStance.solve`): the working girdle lifted and the
 * heels raised, the trunk turned about its long axis, the turn toward a wrist
 * or a point off to the side, the middle of the shoulders and the raised feet
 * fitted, read from the stance's props, body, feet, working shoulder and reach
 * check.
 *
 * @param scope What the stance builds the moves from.
 * @returns The moves.
 */
export function AutoMovieMotionHumanTouchStanceMoves(
  scope: AutoMovieMotionHumanTouchStanceMoves.IScope,
): AutoMovieMotionHumanTouchStanceMoves.IMoves {
  const {
    props,
    body,
    feet,
    shoulder,
    checkReach,
  }: AutoMovieMotionHumanTouchStanceMoves.IScope = scope;
  // A posture with the working girdle lifted and the heels raised.
  const moved: (
    posture: IAutoMovieMotionHumanPosture,
    girdle: number,
    degrees: number,
    ankles?: IAutoMovieMotionHumanRise.Stance,
    share?: number,
  ) => IAutoMovieMotionHumanPosture = (
    posture: IAutoMovieMotionHumanPosture,
    girdle: number,
    degrees: number,
    ankles: IAutoMovieMotionHumanRise.Stance | undefined = feet,
    share: number = 1,
  ): IAutoMovieMotionHumanPosture => {
    posture = props.girdles?.(posture, share) ?? posture;
    const was: readonly [number, number, number] = posture.joints[shoulder] ?? [
      0, 0, 0,
    ];
    return {
      ...posture,
      root:
        ankles === undefined || degrees === 0
          ? posture.root
          : Vector3.add(
              posture.root,
              AutoMovieMotionHumanRise.lift(body, ankles, degrees),
            ),
      joints:
        girdle === 0
          ? posture.joints
          : {
              ...posture.joints,
              [shoulder]: [was[0], was[1] + girdle, was[2]],
            },
    };
  };

  // The trunk turned about its long axis, the lumbar and the thoracic spine
  // each taking the share of the turn their own twist range holds.
  const twisted = (
    posture: IAutoMovieMotionHumanPosture,
    degrees: number,
  ): IAutoMovieMotionHumanPosture => {
    if (degrees === 0) return posture;
    const motion: IAutoMovieMotionHumanRange.Motion =
      degrees > 0 ? "external" : "internal";
    const spans: readonly number[] = TWISTED.map((bone: TwistedBone): number =>
      AutoMovieMotionHumanRange.degrees(bone, motion, "full"),
    );
    const total: number = spans.reduce(
      (sum: number, span: number): number => sum + span,
      0,
    );
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...posture.joints,
    };
    TWISTED.forEach((bone: TwistedBone, k: number): void => {
      const was: readonly [number, number, number] = joints[bone] ?? [0, 0, 0];
      joints[bone] = [was[0], was[1], was[2] + (degrees * spans[k]!) / total];
    });
    return { ...posture, joints };
  };

  // The turn toward a wrist off to the side: the heading's angle to the
  // line from the shoulder to the wrist across the floor, positive toward
  // the left as the spine's twist is, within the two bones' whole range.
  const toward = (posture: IAutoMovieMotionHumanPosture): number => {
    const wrist: IAutoMovieVector3 = props.wrist(posture, 0);
    return angleTo(
      posture,
      checkReach(posture, wrist, prepareHumanPoseResolution()).root,
      wrist,
    );
  };

  // The heading's angle to the line from a point to another across the
  // floor, within the two bones' whole range.
  const angleTo = (
    posture: IAutoMovieMotionHumanPosture,
    from: IAutoMovieVector3,
    point: IAutoMovieVector3,
  ): number => {
    const yaw: number = (posture.yaw * Math.PI) / 180;
    const dx: number = point.x - from.x;
    const dz: number = point.z - from.z;
    const left: number = dx * Math.cos(yaw) - dz * Math.sin(yaw);
    const ahead: number = dx * Math.sin(yaw) + dz * Math.cos(yaw);
    const angle: number = (Math.atan2(left, ahead) * 180) / Math.PI;
    const range: number = TWISTED.reduce(
      (sum: number, bone: TwistedBone): number =>
        sum +
        Math.abs(
          AutoMovieMotionHumanRange.degrees(
            bone,
            angle > 0 ? "external" : "internal",
            "full",
          ),
        ),
      0,
    );
    return Math.max(-range, Math.min(range, angle));
  };

  // The middle of the shoulder joints on a posture, world metres.
  const shoulders = (
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieVector3 => {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      resolveHumanPosture(body, posture),
      undefined,
      HumanBoneGroups.SHOULDERS,
    );
    return Vector3.lerp(
      bones.get("leftUpperArm")!.worldPosition,
      bones.get("rightUpperArm")!.worldPosition,
      0.5,
    );
  };

  /** Fits the same raised feet for the planned key and for display. */
  function planted(
    posture: IAutoMovieMotionHumanPosture,
    ankles: IAutoMovieMotionHumanRise.Stance,
    degrees: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IAutoMovieMotionHumanPosture {
    const left: IAutoMovieHumanLimbGoal = AutoMovieMotionHumanLeg.goal(
      body,
      posture,
      "left",
      AutoMovieMotionHumanRise.foot(body, "left", ankles.left, degrees),
      true,
    );
    const right: IAutoMovieHumanLimbGoal = AutoMovieMotionHumanLeg.goal(
      body,
      posture,
      "right",
      AutoMovieMotionHumanRise.foot(body, "right", ankles.right, degrees),
      true,
    );
    const raised: IAutoMovieMotionHumanPosture = {
      ...posture,
      joints: {
        ...posture.joints,
        leftToes: [degrees, 0, 0],
        rightToes: [degrees, 0, 0],
      },
      limbs: { ...posture.limbs, leftLeg: left, rightLeg: right },
    };
    return {
      ...raised,
      root: lowerHumanPosture(body, raised, undefined, resolution).root,
    };
  }
  return { moved, twisted, toward, angleTo, shoulders, planted };
}

/** What the posture moves of a touch stance read and what they are. */
export namespace AutoMovieMotionHumanTouchStanceMoves {
  /** What a touch stance builds its posture moves from. */
  export interface IScope {
    /** The stance's props. */
    props: IAutoMovieMotionHumanTouchStance.IProps;

    /** The body. */
    body: IAutoMovieMotionHumanTouchStance.IProps["body"];

    /** The feet the heels rise on; none when absent. */
    feet: IAutoMovieMotionHumanRise.Stance | undefined;

    /** The working arm's shoulder girdle. */
    shoulder: Shoulder;

    /** The working arm's reach check. */
    checkReach: ReturnType<typeof AutoMovieMotionHumanReach.prepareCheck>;
  }

  /** A shoulder girdle bone a stance lifts. */
  export type Shoulder = "leftShoulder" | "rightShoulder";

  /** The posture moves. */
  export interface IMoves {
    /**
     * A posture with the working girdle lifted and the heels raised.
     *
     * @param posture The posture.
     * @param girdle The girdle's lift, degrees.
     * @param degrees The heels' rise, degrees.
     * @param ankles The feet the heels rise on; the stance's when absent.
     * @param share The share of the reach made, 1 when absent.
     * @returns The moved posture.
     */
    moved: (
      posture: IAutoMovieMotionHumanPosture,
      girdle: number,
      degrees: number,
      ankles?: IAutoMovieMotionHumanRise.Stance,
      share?: number,
    ) => IAutoMovieMotionHumanPosture;

    /**
     * The trunk turned about its long axis.
     *
     * @param posture The posture.
     * @param degrees The turn, degrees, positive toward the left.
     * @returns The turned posture.
     */
    twisted: (
      posture: IAutoMovieMotionHumanPosture,
      degrees: number,
    ) => IAutoMovieMotionHumanPosture;

    /**
     * The turn toward a wrist off to the side.
     *
     * @param posture The posture.
     * @returns The turn, degrees.
     */
    toward: (posture: IAutoMovieMotionHumanPosture) => number;

    /**
     * The heading's angle to the line from a point to another across the floor,
     * within the turned bones' whole range.
     *
     * @param posture The posture.
     * @param from The line's start, world metres.
     * @param point The line's end, world metres.
     * @returns The angle, degrees.
     */
    angleTo: (
      posture: IAutoMovieMotionHumanPosture,
      from: IAutoMovieVector3,
      point: IAutoMovieVector3,
    ) => number;

    /**
     * The middle of the shoulder joints on a posture.
     *
     * @param posture The posture.
     * @returns The middle, world metres.
     */
    shoulders: (posture: IAutoMovieMotionHumanPosture) => IAutoMovieVector3;

    /**
     * The same raised feet fitted for the planned key and for display.
     *
     * @param posture The posture.
     * @param ankles The feet.
     * @param degrees The heels' rise, degrees.
     * @param resolution The borrowed forward-kinematics reader, if any.
     * @returns The posture on the raised feet.
     */
    planted: (
      posture: IAutoMovieMotionHumanPosture,
      ankles: IAutoMovieMotionHumanRise.Stance,
      degrees: number,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    ) => IAutoMovieMotionHumanPosture;
  }
}
/**
 * The spine's bones a turn of the trunk toward a wrist off to the side twists:
 * the lumbar and the thoracic spine.
 */
const TWISTED: readonly TwistedBone[] = ["spine", "chest"];

/** A spine bone the trunk's turn twists. */
type TwistedBone = "spine" | "chest";

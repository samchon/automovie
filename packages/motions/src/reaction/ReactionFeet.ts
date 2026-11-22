import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The feet of a body going down, held where they stood. A fall that pitches
 * or turns the whole body about its root also turns the feet with it, so a
 * heel or a toe the floor holds swings across it; the feet stay flat and
 * planted at their entry places and attitudes, by leg goals, until the part
 * that lands first bears, and the legs then return to the fall's own shape
 * over `FADE`.
 */
export namespace ReactionFeet {
  /** The two feet's bones. */
  const FEET_BONES: ReadonlySet<AutoMovieHumanoidBone> =
    new Set<AutoMovieHumanoidBone>(["leftFoot", "rightFoot"]);

  /** The two feet's contact parts. */
  const FEET: readonly IAutoMovieMotionHumanContactWindow["part"][] = [
    "leftFoot",
    "rightFoot",
  ];

  /** How long the legs take to leave their planted goals for the fall's shape, seconds: authored. */
  export const FADE: number = 0.2;

  /**
   * A plan whose feet stay planted until a second: its posture with both
   * legs' goals at the entry feet; after it, over `FADE`, each goal travels
   * to where the plan's own legs put the foot, so the legs return to the
   * fall's shape without a jump. Written over the composed posture, so the
   * fall's own leg joints stay one movement.
   *
   * @param plan The fall's plan.
   * @param entry The entry state, its feet.
   * @param body The body, for the released feet's displayed frames.
   * @param until Seconds since the action's start the feet stay planted until.
   * @param knee How high above the ankle the knee's hint lies, metres; it leans ahead along the heading by four tenths of that.
   * @returns The plan with its feet held.
   */
  export function hold(
    plan: IAutoMovieMotionHumanActionPlan,
    entry: IAutoMovieMotionHumanEntryState,
    body: IAutoMovieMotionHumanBody,
    until: number,
    knee: number,
  ): IAutoMovieMotionHumanActionPlan {
    const yaw: number = (entry.posture.yaw * Math.PI) / 180;
    const ahead: IAutoMovieVector3 = {
      x: 0.4 * knee * Math.sin(yaw),
      y: knee,
      z: 0.4 * knee * Math.cos(yaw),
    };
    // The feet's world rotations at rest, so a displayed foot's rotation can
    // be stated from its rest as a goal states it.
    let rest: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> | undefined;
    return {
      ...plan,
      posture: (
        seconds: number,
        channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        const posture: IAutoMovieMotionHumanPosture = plan.posture(
          seconds,
          channels,
          resolution,
          projection,
        );
        if (seconds >= until + FADE) return posture;
        const s: number =
          seconds <= until ? 0 : minimumJerk.share((seconds - until) / FADE);
        // Released, each foot's goal travels from where it stood to where the
        // fall's own legs put it, so the goal is the leg's own at the end.
        let shown:
          | Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>
          | undefined;
        if (s > 0) {
          rest ??= poseBones(
            body,
            resolveHumanPosture(body, {
              root: { x: 0, y: 0, z: 0 },
              yaw: 0,
              pitch: 0,
              roll: 0,
              joints: {},
              limbs: {},
            }),
            undefined,
            FEET_BONES,
          );
          shown = poseBones(
            body,
            resolveHumanPosture(body, posture),
            undefined,
            FEET_BONES,
          );
        }
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
          ...posture.limbs,
        };
        for (const side of ["left", "right"] as const) {
          const foot: IAutoMovieMotionHumanEntryState.IFoot = entry.feet[side];
          const bone: AutoMovieHumanoidBone = `${side}Foot`;
          const point: IAutoMovieVector3 =
            shown === undefined
              ? foot.ankle
              : Vector3.lerp(foot.ankle, shown.get(bone)!.worldPosition, s);
          const rotation: IAutoMovieQuaternion =
            shown === undefined
              ? foot.rotation
              : Quaternion.slerp(
                  foot.rotation,
                  Quaternion.multiply(
                    shown.get(bone)!.worldRotation,
                    Quaternion.inverse(rest!.get(bone)!.worldRotation),
                  ),
                  s,
                );
          limbs[`${side}Leg`] = {
            point,
            rotation,
            bend: Vector3.add(point, ahead),
            planted: s === 0,
          } satisfies IAutoMovieHumanLimbGoal;
        }
        return { ...posture, limbs };
      },
    };
  }

  /**
   * The feet's plant windows until a share of the action.
   *
   * @param until The share the feet stay planted until.
   * @returns Both feet's plant windows.
   */
  export function plants(until: number): IAutoMovieMotionHumanContactWindow[] {
    return FEET.map(
      (
        part: IAutoMovieMotionHumanContactWindow["part"],
      ): IAutoMovieMotionHumanContactWindow => ({
        part,
        kind: "plant",
        from: 0,
        to: until,
        support: { kind: "ground" },
      }),
    );
  }
}

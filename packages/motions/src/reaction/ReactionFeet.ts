import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { mixHumanPosture } from "../posture/mixHumanPosture";

/**
 * The feet of a body going down, held where they stood. A fall that pitches
 * or turns the whole body about its root also turns the feet with it, so a
 * heel or a toe the floor holds swings across it; the feet stay flat and
 * planted at their entry places and attitudes, by leg goals, until the part
 * that lands first bears, and the legs then return to the fall's own shape
 * over `FADE`.
 */
export namespace ReactionFeet {
  /** The two feet's contact parts. */
  const FEET: readonly IAutoMovieMotionHumanContactWindow["part"][] = [
    "leftFoot",
    "rightFoot",
  ];

  /** How long the legs take to leave their planted goals for the fall's shape, seconds: authored. */
  export const FADE: number = 0.2;

  /**
   * A plan whose feet stay planted until a second: its posture with both
   * legs' goals at the entry feet, faded back to the plan's own legs over
   * `FADE` after. Written over the composed posture, so the fall's own leg
   * joints stay one movement and the planted goals take over from them.
   *
   * @param plan The fall's plan.
   * @param entry The entry state, its feet.
   * @param until Seconds since the action's start the feet stay planted until.
   * @param knee How high above the ankle the knee's hint lies, metres; it leans ahead along the heading by four tenths of that.
   * @returns The plan with its feet held.
   */
  export function hold(
    plan: IAutoMovieMotionHumanActionPlan,
    entry: IAutoMovieMotionHumanEntryState,
    until: number,
    knee: number,
  ): IAutoMovieMotionHumanActionPlan {
    const yaw: number = (entry.posture.yaw * Math.PI) / 180;
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
        const weight: number =
          seconds <= until
            ? 1
            : 1 - minimumJerk.share(Math.min(1, (seconds - until) / FADE));
        if (weight <= 0) return posture;
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
          ...posture.limbs,
        };
        for (const side of ["left", "right"] as const) {
          const foot: IAutoMovieMotionHumanEntryState.IFoot = entry.feet[side];
          limbs[`${side}Leg`] = {
            point: foot.ankle,
            rotation: foot.rotation,
            bend: Vector3.add(foot.ankle, {
              x: 0.4 * knee * Math.sin(yaw),
              y: knee,
              z: 0.4 * knee * Math.cos(yaw),
            }),
            planted: true,
          } satisfies IAutoMovieHumanLimbGoal;
        }
        return mixHumanPosture(posture, { ...posture, limbs }, weight);
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

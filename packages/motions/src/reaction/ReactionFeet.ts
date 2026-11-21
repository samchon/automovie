import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
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
   * The primitive that keeps the feet planted until a second.
   *
   * @param entry The entry state, its feet.
   * @param until Seconds since the action's start the feet stay planted until.
   * @param knee How high above the ankle the knee's hint lies, metres; it leans ahead along the heading by four tenths of that.
   * @returns The primitive writing both legs.
   */
  export function planted(
    entry: IAutoMovieMotionHumanEntryState,
    until: number,
    knee: number,
  ): IAutoMovieMotionHumanPrimitive {
    return {
      channels: ["leftLeg", "rightLeg"],
      reads: [],
      from: 0,
      to: until + FADE,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieMotionHumanPosture => {
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
              x: 0.4 * knee * Math.sin((entry.posture.yaw * Math.PI) / 180),
              y: knee,
              z: 0.4 * knee * Math.cos((entry.posture.yaw * Math.PI) / 180),
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

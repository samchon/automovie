import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * Bases of composed actions: the plan whose posture every unclaimed channel
 * keeps.
 *
 * Most actions happen on a body that otherwise stays as it is (a stance, a
 * seat, the posture the action was entered in), so their base is one posture
 * held for the action's duration with the supports it stands on.
 */
export namespace AutoMovieMotionHumanBase {
  /**
   * A base that holds one posture.
   *
   * @param duration Seconds; the composed action's clock lasts as long.
   * @param posture The posture held.
   * @param contacts The supports it stands on, shares of the duration.
   * @returns The plan.
   */
  export function still(
    duration: number,
    posture: IHumanPosture,
    contacts: readonly IHumanContactWindow[] = [],
  ): IHumanActionPlan {
    return {
      duration,
      events: [],
      contacts: [...contacts],
      posture: (): IHumanPosture => posture,
    };
  }

  /**
   * Both feet planted on the ground for a share of an action.
   *
   * @param from Share of the duration the plants start at.
   * @param to Share of the duration the plants end at.
   * @returns The left foot's window, then the right foot's.
   */
  export function plants(
    from: number = 0,
    to: number = 1,
  ): IHumanContactWindow[] {
    return (["leftFoot", "rightFoot"] as const).map(
      (part: "leftFoot" | "rightFoot"): IHumanContactWindow => ({
        part,
        kind: "plant",
        from,
        to,
        support: { kind: "ground" },
      }),
    );
  }
}

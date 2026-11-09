import type { IAutoMovieSchedule } from "@automovie/engine";

import type { IBoutPosture } from "../../laws/kickboxing/IBoutPosture";
import type { IFighterMeasure } from "../../laws/kickboxing/IFighterMeasure";
import { KickboxingAction } from "../../laws/kickboxing/KickboxingAction";
import { KickboxingTiming } from "../../laws/kickboxing/KickboxingTiming";
import { StanceShape } from "../../laws/kickboxing/StanceShape";

/**
 * The guard's rhythm between a fighter's busy actions: inside each free
 * interval, where he throws, answers, touches and performs no whole-body
 * phase, the knees pulse and the lead glove paws at the stepping cadence,
 * fading to nothing at both ends so it joins every action without a jump.
 * Footwork is not busy: the rhythm rides the steps.
 *
 * ```ts
 * posture = GuardRhythm.apply(posture, measure, schedule, "a", 12.3);
 * ```
 *
 * @evidence docs/research/kickboxing/ring-generalship.md#stance The guard keeps its rhythm between exchanges.
 * @evidence docs/research/kickboxing/exchanges.md#activity Movement and feints fill the time between attacks.
 */
export namespace GuardRhythm {
  /**
   * A posture with the rhythm of its free interval added.
   *
   * @param posture The posture before the rhythm.
   * @param measure The fighter's measure.
   * @param schedule The schedule.
   * @param subject The fighter's id.
   * @param seconds Film seconds.
   * @returns The posture, unchanged outside a free interval.
   */
  export function apply(
    posture: IBoutPosture,
    measure: IFighterMeasure,
    schedule: IAutoMovieSchedule,
    subject: string,
    seconds: number,
  ): IBoutPosture {
    const gap = free(schedule, subject, seconds);
    if (gap === null) return posture;
    const beat = StanceShape.rhythm(
      measure,
      seconds - gap.start,
      gap.end - gap.start,
      KickboxingTiming.STEP_PERIOD,
    );
    const lead = posture.hands.left;
    return {
      ...posture,
      drop: posture.drop + beat.drop,
      hands: {
        ...posture.hands,
        left: {
          ...lead,
          point: {
            x: lead.point.x + beat.pump * Math.cos(StanceShape.TURN),
            y: lead.point.y,
            z: lead.point.z + beat.pump * Math.sin(StanceShape.TURN),
          },
        },
      },
    };
  }

  /**
   * The free interval around a second in which a fighter performs no strike,
   * answer, touch or whole-body phase other than a held guard, or null while one is active or none
   * follows.
   *
   * @param schedule The schedule.
   * @param subject The fighter's id.
   * @param seconds Film seconds.
   * @returns The interval, or null.
   */
  export function free(
    schedule: IAutoMovieSchedule,
    subject: string,
    seconds: number,
  ): { start: number; end: number } | null {
    let start: number = 0;
    let end: number = Infinity;
    for (const entry of schedule.entries) {
      if (entry.subject !== subject) continue;
      const capability: string = entry.intent.capability;
      if (
        capability !== "strike" &&
        capability !== "answer" &&
        capability !== "touch" &&
        capability !== "phase"
      )
        continue;
      const action = KickboxingAction.read(entry.intent);
      // A held guard keeps the rhythm.
      if (action.kind === "phase" && action.phase === "guard") continue;
      const stop: number =
        entry.end +
        (action.kind === "strike" ? KickboxingTiming.HAND_RECOVERY : 0);
      if (entry.start <= seconds && seconds < stop) return null;
      if (stop <= seconds) start = Math.max(start, stop);
      else end = Math.min(end, entry.start);
    }
    return Number.isFinite(end) ? { start, end } : null;
  }
}

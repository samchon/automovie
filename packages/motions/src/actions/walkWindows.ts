import type { IAutoMovieMotionEvent } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { walkReach } from "./walkReach";
import type { walkSteps } from "./walkSteps";

/**
 * What a stepping gait declares of its footstep plan, as shares of its
 * length: each named instant, and the floor contacts, each foot's stance a
 * `plant` but for the spans in which the foot spins on its ball, which are a
 * `pivot` on its toe pad.
 *
 * A pelvis turned from a stance foot further than the hip rotates is taken
 * by spinning on the ball of that foot (`walkReach.pelvis`), as a person
 * spins on the stance foot in a spin turn (Hase and Stein 1999). The foot
 * then turns on the floor about its toe pad, so it is declared as turning
 * about the contact there, never as fixed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is declared, when a span is a pivot and why.
 * @evidence contracts/development/design.md#principled-representation The events and windows as data, a stance split where the foot's own spin begins and ends.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function the gait declares its instants and contacts by.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The pivot spans are read from the spin the pelvis actually asks, never typed.
 */
export namespace walkWindows {
  /** The spacing, seconds, at which a stance is read for its spin: half a frame at 60 frames a second. */
  export const STEP: number = 1 / 120;

  /**
   * The events and contact windows of a gait's footstep plan.
   *
   * @param body The body.
   * @param steps The gait's footstep plan.
   * @param pelvis The pelvis joint's clinical angles at a second, degrees.
   * @returns The plan's named instants and its stances' windows, in the stances' order, as shares of the plan's duration.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the results.
   * @evidence contracts/development/implementation.md#principled-implementation Each instant is its second over the duration; a stance is read at `STEP` for the spin `walkReach.pelvis` gives its foot, and split into runs where the foot spins and where it stands.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One map for the instants, one pass per stance.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A stance in which the foot never spins stays one plant, as before.
   * @evidence contracts/development/implementation.md#efficient-algorithms One read per `STEP` of stance.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns new arrays and retains nothing.
   */
  export function of(
    body: IHumanBody,
    steps: walkSteps.IPlan,
    pelvis: (seconds: number) => readonly [number, number, number],
  ): { events: IAutoMovieMotionEvent[]; contacts: IHumanContactWindow[] } {
    const duration: number = steps.duration;
    const events: IAutoMovieMotionEvent[] = steps.events.map(
      (e: { name: string; seconds: number }): IAutoMovieMotionEvent => ({
        name: e.name,
        share: e.seconds / duration,
      }),
    );
    const spins = (side: "left" | "right", t: number): boolean =>
      walkReach.pelvis(body, steps.root(t), steps.yaw(t), pelvis(t), {
        left: steps.foot("left", t),
        right: steps.foot("right", t),
      }).pivots[side] !== 0;
    const contacts: IHumanContactWindow[] = [];
    for (const stance of steps.stances) {
      const part: "leftFoot" | "rightFoot" =
        stance.side === "left" ? "leftFoot" : "rightFoot";
      const push = (
        kind: "plant" | "pivot",
        from: number,
        to: number,
      ): void => {
        contacts.push({
          part,
          kind,
          from: from / duration,
          to: to / duration,
          support: { kind: "ground" },
        });
      };
      let start: number = stance.from;
      let spinning: boolean = spins(stance.side, stance.from);
      for (
        let t: number = stance.from + STEP;
        t < stance.to - 1e-9;
        t += STEP
      ) {
        const now: boolean = spins(stance.side, t);
        if (now === spinning) continue;
        push(spinning ? "pivot" : "plant", start, t);
        start = t;
        spinning = now;
      }
      push(spinning ? "pivot" : "plant", start, stance.to);
    }
    return { events, contacts };
  }
}

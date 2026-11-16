import { wrapDegrees } from "@automovie/engine";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "../posture/HumanFoot";
import { stand } from "./stand";
import { walkFoot } from "./walkFoot";
import { walkReach } from "./walkReach";

/**
 * Each foot's schedule in a walk's footstep plan (`walkSteps`): from its
 * footfalls, the stance it holds before its first toe-off, the swing between
 * a toe-off and the next heel strike, and the stance on each footprint
 * after it, the rockers of each stance being `walkFoot`'s.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a foot's schedule is made of and who owns the rockers.
 * @evidence contracts/development/design.md#principled-representation The footfall as data and one schedule built over a side's footfalls.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The footfall, the toe-off pitch, the instants and stance spans, and the schedule, read by the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A swing's two halves read the stances it joins, so no foot place is typed.
 */
export namespace walkStepFoot {
  /** The toe-off pitch of a straight step, degrees toes-down: the toes' joints are extended about 55° at the end of pre-swing, the toes still flat on the floor and the knee 40° bent (Perry and Burnfield). A shallower foot leaves the ankle behind the advancing hip, so the trailing knee straightens through pre-swing where it bends. */
  export const PUSH: number = 55;

  /**
   * One footfall.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The side, the two instants, the flat footprint, its heading and the push-off before it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members, all read by the plan and the schedule.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The footprint is a placement, the ankle derived by `HumanFoot`.
   */
  export interface IStep {
    /** The foot. */
    side: "left" | "right";

    /** When the heel strikes, seconds. */
    heelStrike: number;

    /** When the foot left for this footfall, seconds. */
    toeOff: number;

    /** The foot flat on its footprint. */
    flat: HumanFoot.IPlacement;

    /** The footprint's heading, degrees. */
    heading: number;

    /** The toe-off pitch of the foot leaving for this footfall, degrees, negative. */
    push: number;

    /** Whether the foot travels backward to this footfall: its stances' rockers run in reverse (`walkFoot.stance`). False when absent. */
    backward?: boolean;
  }

  /**
   * Set each footfall's push-off: a foot turned from the pelvis at its
   * toe-off pushes off less, since a turning step pivots more and pushes
   * less in the sagittal plane (Hase and Stein 1999; Taylor et al. 2005;
   * provisional, the pitch falls linearly to 15 degrees as the turn reaches
   * `walkReach.TWIST`), and a leg kept straight leaves the floor nearly
   * flat, a steep push-off needing the knee it does not bend.
   *
   * @param steps The footfalls, in order; each one's `push` is set.
   * @param start Each foot flat where the walk begins.
   * @param yaw The pelvis's heading at a second, degrees.
   * @param push The straight step's push-off pitch, degrees toes-down.
   * @param stiff The leg kept straight, if any.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both rules, their sources and each input.
   * @evidence contracts/development/implementation.md#principled-implementation The turn a foot leaves is its last heading against the pelvis's at the toe-off; the pitch falls with it and is capped for a straight knee.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass per foot.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The 15 degrees and the linear fall are provisional and stated so.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the footfalls.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Writes the footfalls given and retains nothing.
   */
  export function pushed(
    steps: readonly IStep[],
    start: Record<"left" | "right", HumanFoot.IPlacement>,
    yaw: (seconds: number) => number,
    push: number,
    stiff?: "left" | "right",
  ): void {
    for (const side of ["left", "right"] as const) {
      let leaving: number = HumanFoot.heading(start[side].rotation);
      for (const step of steps.filter((x: IStep): boolean => x.side === side)) {
        const turned: number = wrapDegrees(
          leaving -
            (yaw(step.toeOff) +
              (side === "left" ? stand.TOE_OUT : -stand.TOE_OUT)),
        );
        step.push =
          -push +
          (push - Math.min(push, 15)) *
            Math.min(1, Math.abs(turned) / walkReach.TWIST);
        if (stiff === side)
          step.push = Math.max(step.push, -walkFoot.STIFF_PUSH);
        leaving = step.heading;
      }
    }
  }

  /**
   * The named instants and each foot's stance spans of a walk's footfalls.
   *
   * @param steps The footfalls, in order.
   * @param last The last footfall, seconds.
   * @param duration The walk's length, seconds.
   * @returns Each foot's numbered toe-offs and heel strikes with the last footfall and the arrival, in time order, and each foot's stances from the start to the end.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and both results.
   * @evidence contracts/development/implementation.md#principled-implementation A stance runs from a heel strike to the foot's next toe-off; the first from the start, the last to the end.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass for the instants, one per foot for the stances.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every footfall names both its instants.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the footfalls but the sort.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns new arrays and retains nothing.
   */
  export function windows(
    steps: readonly IStep[],
    last: number,
    duration: number,
  ): {
    events: { name: string; seconds: number }[];
    stances: { side: "left" | "right"; from: number; to: number }[];
  } {
    const counts: Record<string, number> = {};
    const events: { name: string; seconds: number }[] = [];
    for (const step of steps) {
      counts[step.side] = (counts[step.side] ?? 0) + 1;
      events.push(
        {
          name: `${step.side}ToeOff${counts[step.side]}`,
          seconds: step.toeOff,
        },
        {
          name: `${step.side}HeelStrike${counts[step.side]}`,
          seconds: step.heelStrike,
        },
      );
    }
    events.push(
      { name: "lastFootfall", seconds: last },
      { name: "arrive", seconds: duration },
    );
    events.sort(
      (
        a: { name: string; seconds: number },
        b: { name: string; seconds: number },
      ): number => a.seconds - b.seconds,
    );
    const stances: { side: "left" | "right"; from: number; to: number }[] = [];
    for (const side of ["left", "right"] as const) {
      let from: number = 0;
      for (const step of steps.filter((s: IStep): boolean => s.side === side)) {
        stances.push({ side, from, to: step.toeOff });
        from = step.heelStrike;
      }
      stances.push({ side, from, to: duration });
    }
    return { events, stances };
  }

  /**
   * A foot's schedule over its footfalls.
   *
   * @param body The body.
   * @param side The foot.
   * @param start The foot flat where the walk begins.
   * @param own The foot's footfalls, in order.
   * @param raised How far the gait holds the heels off the floor, degrees.
   * @returns The foot's scheduled stance at a second, with its swing while it swings.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Each stance is `walkFoot.stance` between a heel strike and the next toe-off; a swing's first half reads the stance it leaves and its second the one it reaches.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepares one stance reader per footprint, then selects the first unfinished footfall by its heel strike.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The last stance is held open, so a foot after its last footfall stays planted.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear preparation and storage in the foot's footfalls, logarithmic selection and one stance evaluation per planted read.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each swing reuses its two scheduled endpoint stances; the body, side, footfalls and raised pitch remain fixed for the schedule.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned schedule owns its readers and two endpoints per footfall, released with that plan; no query history is retained.
   */
  export function schedule(
    body: IHumanBody,
    side: "left" | "right",
    start: HumanFoot.IPlacement,
    own: readonly IStep[],
    raised: number,
  ): (t: number) => walkFoot.IScheduled {
    const stances: ((t: number) => walkFoot.IFoot)[] = [];
    for (let i: number = 0; i <= own.length; i++) {
      const previous: IStep | undefined = own[i - 1];
      const next: IStep | undefined = own[i];
      const flat: HumanFoot.IPlacement = previous?.flat ?? start;
      const facing: number =
        previous?.heading ?? HumanFoot.heading(start.rotation);
      const strike: number = previous?.heelStrike ?? -Infinity;

      // The opening stance follows its first step's direction; later ones
      // retain the direction of the footprint they stand on.
      const backward: boolean = (previous ?? next)?.backward === true;
      stances.push(
        walkFoot.prepareStance(
          body,
          side,
          flat,
          facing,
          strike,
          next?.toeOff ?? Infinity,
          next?.push ?? -PUSH,
          raised,
          backward,
        ),
      );
    }
    const ends: { from: walkFoot.IFoot; to: walkFoot.IFoot }[] = own.map(
      (step: IStep, i: number): { from: walkFoot.IFoot; to: walkFoot.IFoot } => ({
        from: stances[i]!(step.toeOff),
        to: stances[i + 1]!(step.heelStrike),
      }),
    );
    return (t: number): walkFoot.IScheduled => {
      let low: number = 0;
      let high: number = own.length;
      while (low < high) {
        const middle: number = (low + high) >>> 1;
        if (t < own[middle]!.heelStrike) high = middle;
        else low = middle + 1;
      }
      const step: IStep | undefined = own[low];
      if (step === undefined || t < step.toeOff) return stances[low]!(t);
      const u: number = (t - step.toeOff) / (step.heelStrike - step.toeOff);
      const end: walkFoot.IFoot = u < 0.5 ? ends[low]!.from : ends[low]!.to;
      return {
        placement: {
          ankle: { ...end.placement.ankle },
          rotation: { ...end.placement.rotation },
        },
        toes: end.toes,
        swing: { u, off: step.toeOff, on: step.heelStrike },
      };
    };
  }
}

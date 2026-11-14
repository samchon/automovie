import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "../posture/HumanFoot";
import { walkFoot } from "./walkFoot";

/**
 * Each foot's schedule in a walk's footstep plan (`walkSteps`): from its
 * footfalls, the stance it holds before its first toe-off, the swing between
 * a toe-off and the next heel strike, and the stance on each footprint
 * after it, the rockers of each stance being `walkFoot`'s.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a foot's schedule is made of and who owns the rockers.
 * @evidence contracts/development/design.md#principled-representation The footfall as data and one schedule built over a side's footfalls.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The footfall, the toe-off pitch and the schedule, read by the plan.
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
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One walk over the footfalls per read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The last stance is held open, so a foot after its last footfall stays planted.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the foot's footfalls per read, a few dozen at most.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `walkFoot.stance`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The schedule holds the footfalls only.
   */
  export function schedule(
    body: IHumanBody,
    side: "left" | "right",
    start: HumanFoot.IPlacement,
    own: readonly IStep[],
    raised: number,
  ): (t: number) => walkFoot.IScheduled {
    return (t: number): walkFoot.IScheduled => {
      let flat: HumanFoot.IPlacement = start;
      let facing: number = HumanFoot.heading(flat.rotation);
      let strike: number = -Infinity;
      let back: boolean = false;
      for (const [i, step] of own.entries()) {
        // A starting stance leaves the way its first step goes.
        const backward: boolean = Number.isFinite(strike)
          ? back
          : step.backward === true;
        const leave = (at: number): walkFoot.IFoot =>
          walkFoot.stance(
            body,
            side,
            flat,
            facing,
            strike,
            step.toeOff,
            at,
            step.push,
            raised,
            backward,
          );
        if (t < step.toeOff) return leave(t);
        if (t < step.heelStrike) {
          const u: number = (t - step.toeOff) / (step.heelStrike - step.toeOff);
          const next: IStep | undefined = own[i + 1];
          return {
            ...(u < 0.5
              ? leave(step.toeOff)
              : walkFoot.stance(
                  body,
                  side,
                  step.flat,
                  step.heading,
                  step.heelStrike,
                  next?.toeOff ?? Infinity,
                  step.heelStrike,
                  next?.push ?? -PUSH,
                  raised,
                  step.backward === true,
                )),
            swing: { u, off: step.toeOff, on: step.heelStrike },
          };
        }
        flat = step.flat;
        facing = step.heading;
        strike = step.heelStrike;
        back = step.backward === true;
      }
      return walkFoot.stance(
        body,
        side,
        flat,
        facing,
        strike,
        Infinity,
        t,
        -PUSH,
        raised,
        back,
      );
    };
  }
}

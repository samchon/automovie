import {
  Quaternion,
  Vector3,
  AutoMovieEngineMotionSampling,
} from "@automovie/engine";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
} from "../core";
import { EquineLine } from "./equine/EquineLine";

/**
 * An equid tied by its lead to a ring or rail and untied again: the lead's held
 * run is carried from where it hangs to the ring, wrapped round the ring's bar
 * and made fast on top of it, stays there while the equid stands tied, and is
 * unwrapped and carried back to hang from the halter.
 *
 * The held run moves on the handler's hand's path, so a handler whose hand
 * holds the lead (`tendHorse`, task `lead`) carries, wraps and unwraps it: the
 * carry is a minimum-jerk share from the lead's own hanging place, read live
 * from the equid's sample, to the top of the bar; each wrap is one turn round
 * the bar's axis at the ring's radius; untying runs the same path back, ending
 * on the live hanging place, so the line is the equid's own lead before the tie
 * and after the untie. No knot is tied finger by finger, as no knot law exists
 * to compose one from: the wraps and the hand that closes on the lead through
 * them stand for the hitch. The line is laid from the held run to the halter
 * (`EquineLine`). While tied the lead's drawn length is the tether, the
 * distance the head may go from the ring: a sample whose halter is farther from
 * the knot than the tether is refused, so a tied head stays within the tether's
 * reach.
 */
export namespace AutoMovieArchetypeEquineTie {
  /**
   * One tying or untying: when it starts, how long the carry takes and the
   * wraps round the bar.
   */
  export interface IPhase {
    /** Film second it starts. */
    from: number;

    /**
     * Seconds carrying the lead between its hanging place and the bar,
     * positive.
     */
    carry: number;

    /** Turns round the bar, a whole number from one. */
    wraps: number;

    /** Seconds each turn takes, positive. */
    wrap: number;
  }

  /** A tie. */
  export interface ITie {
    /** The ring's centre on its bar, world metres. */
    ring: IAutoMovieVector3;

    /** The bar's direction at the ring, horizontal, world. */
    axis: IAutoMovieVector3;

    /** The radius the lead wraps the bar at, metres, positive. */
    radius: number;

    /**
     * The longest the lead runs from the knot to the halter while tied, metres,
     * positive.
     */
    tether: number;

    /** The tying. */
    tie: IPhase;

    /** The untying, after the tie; tied to the end when absent. */
    untie?: IPhase;
  }

  /**
   * Tie an equid's lead to a ring and untie it.
   *
   * @param ride The equid's ride, after any layer that moves the head's
   *   contacts.
   * @param lead The lead's held-run contact.
   * @param length The lead's whole length, metres.
   * @param tie The tie.
   * @returns The ride with the lead tied.
   * @throws {RangeError} For malformed phases or geometry.
   * @throws {AutoMovieArchetypeRefusal} At a tied sample whose halter is beyond
   *   the tether, or as `EquineLine.layer` refuses.
   */
  export function layer<Id extends string, D extends string>(
    ride: AutoMovieArchetypeRide.IRide<Id, D>,
    lead: Id,
    length: number,
    tie: ITie,
  ): AutoMovieArchetypeRide.IRide<Id, D> {
    const phases: readonly IPhase[] =
      tie.untie === undefined ? [tie.tie] : [tie.tie, tie.untie];
    if (
      !(tie.radius > 0 && tie.tether > 0 && tie.tether <= length) ||
      phases.some(
        (phase: IPhase): boolean =>
          !(phase.carry > 0 && phase.wraps >= 1 && phase.wrap > 0),
      ) ||
      (tie.untie !== undefined && !(tie.untie.from >= end(tie.tie)))
    )
      throw new RangeError(
        "A tie has a positive radius, a tether within the lead, phases with a positive carry, whole wraps and a positive wrap time, and an untie after the tie",
      );
    const axis: IAutoMovieVector3 = Vector3.normalize(tie.axis);
    const top: IAutoMovieVector3 = Vector3.addScaled(
      tie.ring,
      { x: 0, y: 1, z: 0 },
      tie.radius,
    );
    const knotted: number = end(tie.tie);
    const loosed: number = tie.untie === undefined ? Infinity : tie.untie.from;
    const hanging = (
      sample: AutoMovieArchetypeRide.ISample<Id, D>,
    ): IAutoMovieVector3 =>
      AutoMovieArchetypeFrame.compose(
        sample.placement,
        sample.archetype.affordance(lead).frame,
      ).translation;
    const round = (turns: number): IAutoMovieVector3 =>
      Vector3.add(
        tie.ring,
        Quaternion.rotateVector(
          Quaternion.fromAxisAngle(axis, 360 * turns),
          Vector3.subtract(top, tie.ring),
        ),
      );
    const held = (
      seconds: number,
      sample: AutoMovieArchetypeRide.ISample<Id, D>,
    ): IAutoMovieVector3 => {
      if (seconds < tie.tie.from) return hanging(sample);
      if (seconds < knotted) return along(tie.tie, seconds, sample, false);
      if (seconds < loosed) return top;
      if (seconds < end(tie.untie!))
        return along(tie.untie!, seconds, sample, true);
      return hanging(sample);
    };
    // Tying carries the lead to the bar's top, then wraps; untying unwraps, then carries it back.
    const along = (
      phase: IPhase,
      seconds: number,
      sample: AutoMovieArchetypeRide.ISample<Id, D>,
      untying: boolean,
    ): IAutoMovieVector3 => {
      const winding: number = phase.wraps * phase.wrap;
      const carried = (share: number): IAutoMovieVector3 =>
        Vector3.lerp(hanging(sample), top, AutoMovieEngineMotionSampling.minimumJerkShare(share));
      const local: number = seconds - phase.from;
      if (!untying)
        return local < phase.carry
          ? carried(local / phase.carry)
          : round(
              phase.wraps * AutoMovieEngineMotionSampling.minimumJerkShare((local - phase.carry) / winding),
            );
      return local < winding
        ? round(phase.wraps * (1 - AutoMovieEngineMotionSampling.minimumJerkShare(local / winding)))
        : carried(1 - (local - winding) / phase.carry);
    };
    const laid: AutoMovieArchetypeRide.IRide<Id, D> = EquineLine.layer(
      ride,
      lead,
      held,
      length,
    );
    const at = (seconds: number): AutoMovieArchetypeRide.ISample<Id, D> => {
      const sample: AutoMovieArchetypeRide.ISample<Id, D> = laid.at(seconds);
      if (seconds >= knotted && seconds < loosed) {
        const run: number = sample.archetype.span(lead).length;
        if (!(run <= tie.tether))
          throw new AutoMovieArchetypeRefusal({
            kind: "parameter",
            archetype: sample.archetype.archetype,
            axis: "tether",
            value: run,
            feasible: {
              kind: "range",
              minimum: 0,
              maximum: tie.tether,
              unit: "m",
            },
            reason: `the tied halter is ${run} m from the knot at film second ${seconds}, beyond the ${tie.tether} m tether`,
            fix: "Keep the tied head within the tether's reach of the ring, or tie a longer tether.",
          });
      }
      return sample;
    };
    return {
      plan: ride.plan,
      duration: Math.max(
        ride.duration,
        tie.untie === undefined ? knotted : end(tie.untie),
      ),
      instants: [
        ...ride.instants,
        { seconds: tie.tie.from, label: "tie:start" },
        { seconds: knotted, label: "tie:knot" },
        ...(tie.untie === undefined
          ? []
          : [
              { seconds: tie.untie.from, label: "untie:start" },
              { seconds: end(tie.untie), label: "untie:free" },
            ]),
      ].sort(
        (
          p: AutoMovieArchetypeRide.IRide<Id, D>["instants"][number],
          q: AutoMovieArchetypeRide.IRide<Id, D>["instants"][number],
        ): number => p.seconds - q.seconds,
      ),
      at,
      frame: (id: Id, seconds: number): IAutoMovieTransform => {
        const sample: AutoMovieArchetypeRide.ISample<Id, D> = at(seconds);
        return AutoMovieArchetypeFrame.compose(
          sample.placement,
          sample.archetype.affordance(id).frame,
        );
      },
    };
  }

  /**
   * The film second a phase ends.
   *
   * @param phase The phase.
   * @returns Its start, carry and wraps summed.
   */
  export function end(phase: IPhase): number {
    return phase.from + phase.carry + phase.wraps * phase.wrap;
  }
}

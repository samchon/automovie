import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ArchetypeFrame, ArchetypeRefusal, type ArchetypeRide } from "../core";
import { EquineLine } from "./EquineLine";

/**
 * An equid tied by its lead to a ring or rail and untied again: the lead's held run is carried from where it hangs to the ring, wrapped round the ring's bar and made fast on top of it, stays there while the equid stands tied, and is unwrapped and carried back to hang from the halter.
 *
 * The held run moves on the handler's hand's path, so a handler whose hand holds the lead (`tendHorse`, task `lead`) carries, wraps and unwraps it: the carry is a minimum-jerk share from the lead's own hanging place, read live from the equid's sample, to the top of the bar; each wrap is one turn round the bar's axis at the ring's radius; untying runs the same path back, ending on the live hanging place, so the line is the equid's own lead before the tie and after the untie. No knot is tied finger by finger, as no knot law exists to compose one from: the wraps and the hand that closes on the lead through them stand for the hitch. The line is laid from the held run to the halter (`EquineLine`). While tied the lead's drawn length is the tether, the distance the head may go from the ring: a sample whose halter is farther from the knot than the tether is refused, so a tied head stays within the tether's reach.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the path, who carries it, the tied interval and the refusal.
 * @evidence contracts/development/design.md#principled-representation A ride in, a ride out on the same clock; the ring is a world point with a bar axis and radius, the phases in film seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One layer over `EquineLine`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The lead is the equid's own span; the tether is a bound, not a pull simulated.
 */
export namespace EquineTie {
  /**
   * One tying or untying: when it starts, how long the carry takes and the wraps round the bar.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Film seconds, seconds and a whole count.
   * @evidence contracts/development/design.md#principled-representation A start, a carry, a count and a turn's time.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The tie's and the untie's phases.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IPhase {
    /** Film second it starts. */
    from: number;

    /** Seconds carrying the lead between its hanging place and the bar, positive. */
    carry: number;

    /** Turns round the bar, a whole number from one. */
    wraps: number;

    /** Seconds each turn takes, positive. */
    wrap: number;
  }

  /**
   * A tie.
   *
   * @evidence contracts/development/common.md#meaningful-documentation World metres and the phases.
   * @evidence contracts/development/design.md#principled-representation The ring's centre, its bar's axis and radius, the tether and the phases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `layer` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ITie {
    /** The ring's centre on its bar, world metres. */
    ring: IAutoMovieVector3;

    /** The bar's direction at the ring, horizontal, world. */
    axis: IAutoMovieVector3;

    /** The radius the lead wraps the bar at, metres, positive. */
    radius: number;

    /** The longest the lead runs from the knot to the halter while tied, metres, positive. */
    tether: number;

    /** The tying. */
    tie: IPhase;

    /** The untying, after the tie; tied to the end when absent. */
    untie?: IPhase;
  }

  /**
   * Tie an equid's lead to a ring and untie it.
   *
   * @param ride The equid's ride, after any layer that moves the head's contacts.
   * @param lead The lead's held-run contact.
   * @param length The lead's whole length, metres.
   * @param tie The tie.
   * @returns The ride with the lead tied.
   * @throws {RangeError} For malformed phases or geometry.
   * @throws {ArchetypeRefusal} At a tied sample whose halter is beyond the tether, or as `EquineLine.layer` refuses.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the output and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The held point by phase: the live hanging place, the carry's share between it and the bar's top, a turn round the bar's axis per wrap, the knot; the line laid to it; the tether measured on the laid span while tied.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A held-point function and one check.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is clamped to the tether.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per sample beyond the line's.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `EquineLine`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the ride and the tie.
   */
  export function layer<Id extends string, D extends string>(
    ride: ArchetypeRide.IRide<Id, D>,
    lead: Id,
    length: number,
    tie: ITie,
  ): ArchetypeRide.IRide<Id, D> {
    const phases: readonly IPhase[] =
      tie.untie === undefined ? [tie.tie] : [tie.tie, tie.untie];
    if (
      !(tie.radius > 0 && tie.tether > 0 && tie.tether <= length) ||
      phases.some(
        (phase: IPhase): boolean =>
          !(
            Number.isFinite(phase.from) &&
            phase.carry > 0 &&
            Number.isInteger(phase.wraps) &&
            phase.wraps >= 1 &&
            phase.wrap > 0
          ),
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
    const hanging = (sample: ArchetypeRide.ISample<Id, D>): IAutoMovieVector3 =>
      ArchetypeFrame.compose(
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
      sample: ArchetypeRide.ISample<Id, D>,
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
      sample: ArchetypeRide.ISample<Id, D>,
      untying: boolean,
    ): IAutoMovieVector3 => {
      const winding: number = phase.wraps * phase.wrap;
      const carried = (share: number): IAutoMovieVector3 =>
        Vector3.lerp(hanging(sample), top, minimumJerk.share(share));
      const local: number = seconds - phase.from;
      if (!untying)
        return local < phase.carry
          ? carried(local / phase.carry)
          : round(
              phase.wraps * minimumJerk.share((local - phase.carry) / winding),
            );
      return local < winding
        ? round(phase.wraps * (1 - minimumJerk.share(local / winding)))
        : carried(1 - (local - winding) / phase.carry);
    };
    const laid: ArchetypeRide.IRide<Id, D> = EquineLine.layer(
      ride,
      lead,
      held,
      length,
    );
    const at = (seconds: number): ArchetypeRide.ISample<Id, D> => {
      const sample: ArchetypeRide.ISample<Id, D> = laid.at(seconds);
      if (seconds >= knotted && seconds < loosed) {
        const run: number = sample.archetype.span(lead).length;
        if (!(run <= tie.tether))
          throw new ArchetypeRefusal({
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
          p: ArchetypeRide.IRide<Id, D>["instants"][number],
          q: ArchetypeRide.IRide<Id, D>["instants"][number],
        ): number => p.seconds - q.seconds,
      ),
      at,
      frame: (id: Id, seconds: number): IAutoMovieTransform => {
        const sample: ArchetypeRide.ISample<Id, D> = at(seconds);
        return ArchetypeFrame.compose(
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the sum.
   * @evidence contracts/development/implementation.md#principled-implementation The carry and the wraps run one after the other.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function end(phase: IPhase): number {
    return phase.from + phase.carry + phase.wraps * phase.wrap;
  }
}

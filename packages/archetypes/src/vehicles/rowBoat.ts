import type { IAutoMovieTransform } from "@automovie/interface";

import {
  type Archetype,
  ArchetypeCourse,
  ArchetypeFrame,
  ArchetypeRefusal,
  type ArchetypeRide,
  ArchetypeSea,
} from "../core";
import { BoatOars } from "./BoatOars";
import type { createBoat } from "./createBoat";

/**
 * A rowboat rowed along a course: its root on the path, its oars swept through the stroke cycle and lifted out of the water on the recovery, at a stroke rate the speed sets, on still water or a seeded sea.
 *
 * Each stroke is World Rowing's cycle (2015 media guide glossary, p. 12, https://d2cx26qpfwuhvu.cloudfront.net/worldrowing/wp-content/uploads/2020/12/04181521/GlossaryofRowingTerms_Neutral.pdf): the catch puts the blade in the water, the drive pulls it from the catch to the finish in the water, the finish takes it out, and the recovery carries it clear back to the catch. The boat covers `STROKE` metres a stroke, so the stroke rate is the speed over that, and the drive takes Kleshnev's share of the cycle at that rate. The oars sweep the `BoatOars.ARC`, easing in and out of each end; through the drive the blade sinks from the water's surface at the catch to its working depth and rises back to the surface at the finish, and through the recovery it lifts `BoatOars.CLEAR` above the water and comes down again. The ride's instants add `catch<k>` at each stroke's catch, so a rower's hands follow the handles as a cyclist's feet follow the pedals.
 *
 * @param boat The rowboat.
 * @param course The course its root follows, or its plan.
 * @param options `sea`, a sea the boat rides on (`ArchetypeSea`); still water when absent.
 * @returns The ride.
 * @throws {ArchetypeRefusal} When the boat has no oars, or as `ArchetypeCourse.plan` does for a malformed course.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the stroke cycle and its source, how the rate follows the speed, what the oars do in each phase, the instants and the sea.
 * @evidence contracts/development/implementation.md#principled-implementation Strokes are counted by the distance covered, so a stroke's phase is the distance's fraction of `STROKE` and needs no integration; the drive's share is Kleshnev's rhythm at the stroke rate, 0.84 r + 25.1 percent with r in strokes a minute (ISBS 1996, p. 322, https://ojs.ub.uni-konstanz.de/cpa/article/view/2726/2573), its rate held inside the study's 26 to 36.5 strokes a minute. The sweep eases by half a cosine; the lift is the touch angle less a half sine of it through the drive and the touch angle plus a half sine of the rest of the clearance through the recovery, so the blade is below the water exactly between the catch and the finish.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Plan, find the catches, then one pose per second, floated on the sea when there is one.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts `STROKE` is a named provisional value, and Kleshnev's rhythm and the arc were read for sliding-seat boats; the blade's feathering is not turned.
 * @evidence contracts/development/implementation.md#efficient-algorithms One course sample per pose; the catches by bisection, about forty course samples each, once per ride.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The plan and the oars' geometry are shared by every sample.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the boat, the plan and the sea for as long as the caller keeps the ride.
 */
export function rowBoat(
  boat: Archetype<createBoat.Affordance, createBoat.Dimension>,
  course: ArchetypeCourse.ICourse | ArchetypeCourse.IPlan,
  options: { sea?: ArchetypeSea.IOptions } = {},
): ArchetypeRide.IRide<createBoat.Affordance, createBoat.Dimension> {
  if (
    boat.affordances.every(
      (a: { id: string }): boolean => a.id !== "leftOarlock",
    )
  )
    throw new ArchetypeRefusal({
      kind: "parameter",
      archetype: boat.archetype,
      axis: "kind",
      value: boat.name,
      feasible: { kind: "alternatives", values: ["rowboat"] },
      reason: `${boat.name ?? boat.id} has no oars to row with`,
      fix: "row a rowboat",
    });
  const plan: ArchetypeCourse.IPlan =
    course.kind === "plan"
      ? course
      : ArchetypeCourse.plan(boat.archetype, course);
  const g: BoatOars.IGeometry = BoatOars.geometry(boat.dimensions);

  // The catches: where the distance covered reaches each whole stroke.
  const strokes: number = Math.floor(
    plan.at(plan.duration).distance / rowBoat.STROKE + 1e-9,
  );
  const instants: { seconds: number; label: string }[] = [];
  for (let k: number = 1; k <= strokes; k++) {
    let low: number = 0;
    let high: number = plan.duration;
    for (let step: number = 0; step < 40; step++) {
      const middle: number = (low + high) / 2;
      if (plan.at(middle).distance < k * rowBoat.STROKE) low = middle;
      else high = middle;
    }
    instants.push({ seconds: high, label: `catch${k}` });
  }

  const ease = (q: number): number => (1 - Math.cos(Math.PI * q)) / 2;
  const at = (
    seconds: number,
  ): ArchetypeRide.ISample<createBoat.Affordance, createBoat.Dimension> => {
    const state: ArchetypeCourse.IState = plan.at(seconds);
    const turns: number = state.distance / rowBoat.STROKE;
    const p: number = turns - Math.floor(turns);
    const drive: number = rowBoat.drive(rowBoat.rate(state.speed));
    let sweep: number;
    let lift: number;
    if (p < drive) {
      const q: number = p / drive;
      sweep =
        BoatOars.ARC.catch -
        (BoatOars.ARC.catch + BoatOars.ARC.finish) * ease(q);
      lift = g.touch * (1 - Math.sin(Math.PI * q));
    } else {
      const q: number = (p - drive) / (1 - drive);
      sweep =
        -BoatOars.ARC.finish +
        (BoatOars.ARC.catch + BoatOars.ARC.finish) * ease(q);
      lift = g.touch + (g.clear - g.touch) * Math.sin(Math.PI * q);
    }
    return {
      archetype: boat.articulate({
        leftOarlock: sweep,
        rightOarlock: sweep,
        leftOar: lift,
        rightOar: lift,
      }),
      placement: state.placement,
      course: state,
    };
  };
  const ride: ArchetypeRide.IRide<createBoat.Affordance, createBoat.Dimension> =
    {
      plan,
      duration: plan.duration,
      instants: [...plan.instants, ...instants].sort(
        (a: { seconds: number }, b: { seconds: number }): number =>
          a.seconds - b.seconds,
      ),
      at,
      frame: (
        id: createBoat.Affordance,
        seconds: number,
      ): IAutoMovieTransform => {
        const sample: ArchetypeRide.ISample<
          createBoat.Affordance,
          createBoat.Dimension
        > = at(seconds);
        return ArchetypeFrame.compose(
          sample.placement,
          sample.archetype.affordance(id).frame,
        );
      },
    };
  return options.sea === undefined
    ? ride
    : ArchetypeSea.float(ride, ArchetypeSea.of(options.sea));
}

/**
 * Companion constants and rules of {@link rowBoat}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each constant and rule states its source, or that none was read.
 * @evidence contracts/development/design.md#principled-representation The stroke's distance and the two rules from speed to rate and from rate to the drive's share.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the ride and a test of it read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace rowBoat {
  /** The distance the boat covers each stroke, metres, a provisional value: no source read gives a fixed-seat rowboat's; the source to read is a measured distance per stroke of one, or one boat's speed and stroke rate measured together. Searched for #3497 without a figure: fixed-seat distance per stroke for skiffs, gigs and whalers; Cornish pilot gig stroke rate and speed; Whitehall strokes a minute and knots (only guesses and marketing); Navy whaleboat and cutter pulling drill; Agius et al. 2023, The Kinematics of Fixed-Seat Rowing (Bioengineering 10(7):774), which measures the body only; USNI Proceedings June 1890, Navy Boats, which gives no speed under oars. */
  export const STROKE: number = 3;

  /** The stroke rate's range inside which Kleshnev measured the drive's share, strokes a minute (ISBS 1996, p. 321). */
  export const RATES: readonly [number, number] = [26, 36.5];

  /**
   * The stroke rate at a speed.
   *
   * @param speed The boat's speed, metres per second.
   * @returns Strokes a minute.
   *
   */
  export function rate(speed: number): number {
    return (60 * speed) / STROKE;
  }

  /**
   * The drive's share of the stroke cycle at a stroke rate: Kleshnev's rhythm, 0.84 r + 25.1 percent, the rate held inside the measured range.
   *
   * @param strokes The stroke rate, strokes a minute.
   * @returns The share, 0 to 1.
   *
   */
  export function drive(strokes: number): number {
    const r: number = Math.min(Math.max(strokes, RATES[0]), RATES[1]);
    return (0.84 * r + 25.1) / 100;
  }
}

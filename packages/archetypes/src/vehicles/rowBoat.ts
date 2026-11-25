import { RigidCarrierSample } from "@automovie/engine";
import type { IAutoMovieTransform } from "@automovie/interface";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeArticulation,
  type AutoMovieArchetypeCourse,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
  AutoMovieArchetypeSea,
} from "../core";
import { ArchetypeCourseLegs } from "../core/ArchetypeCourseLegs";
import { BoatOars } from "./BoatOars";
import { createBoat } from "./createBoat";

/** Complete rowboat state at a film second. */
type Sample = AutoMovieArchetypeRide.ISample<
  createBoat.Affordance,
  createBoat.Dimension
>;

/** A rowboat and its authored clock and articulation readers. */
type Ride = AutoMovieArchetypeRide.IRide<
  createBoat.Affordance,
  createBoat.Dimension
>;

/**
 * A rowboat rowed along a course: its root on the path, its oars swept through
 * the stroke cycle and lifted out of the water on the recovery, at a stroke
 * rate the speed sets, on still water or a seeded sea.
 *
 * Each stroke is World Rowing's cycle (2015 media guide glossary, p. 12,
 * https://d2cx26qpfwuhvu.cloudfront.net/worldrowing/wp-content/uploads/2020/12/04181521/GlossaryofRowingTerms_Neutral.pdf):
 * the catch puts the blade in the water, the drive pulls it from the catch to
 * the finish in the water, the finish takes it out, and the recovery carries it
 * clear back to the catch. The boat covers `STROKE` metres a stroke, so the
 * stroke rate is the speed over that, and the drive takes Kleshnev's share of
 * the cycle at that rate. The oars sweep the `BoatOars.ARC`, easing in and out
 * of each end; through the drive the blade sinks from the water's surface at
 * the catch to its working depth and rises back to the surface at the finish,
 * and through the recovery it lifts `BoatOars.CLEAR` above the water and comes
 * down again. The ride's instants add `catch<k>` at each stroke's catch, so a
 * rower's hands follow the handles as a cyclist's feet follow the pedals.
 *
 * Use `rowBoat.bind` to give a native ride one film start and pass its paired
 * root and socket readers to the prop adapter. Both hold the initial pose
 * before the start. On still water they also hold the final pose strictly after
 * the course ends.
 *
 * @param boat The rowboat.
 * @param course The course its root follows, or its plan.
 * @param options `sea`, a sea the boat rides on (`AutoMovieArchetypeSea`);
 *   still water when absent.
 * @returns The ride.
 * @throws {AutoMovieArchetypeRefusal} When the boat has no oars, or as
 *   `AutoMovieArchetypeCourse.plan` does for a malformed course.
 */
export function rowBoat(
  boat: AutoMovieArchetype<createBoat.Affordance, createBoat.Dimension>,
  course: AutoMovieArchetypeCourse.ICourse | AutoMovieArchetypeCourse.IPlan,
  options: { sea?: AutoMovieArchetypeSea.IOptions } = {},
): rowBoat.IRowRide {
  if (
    boat.affordances.every(
      (a: { id: string }): boolean => a.id !== "leftOarlock",
    )
  )
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: boat.archetype,
      axis: "kind",
      value: boat.name,
      feasible: { kind: "alternatives", values: ["rowboat"] },
      reason: `${boat.name ?? boat.id} has no oars to row with`,
      fix: "row a rowboat",
    });
  const { plan, distanceAt }: ReturnType<typeof ArchetypeCourseLegs.plan> =
    course.kind === "plan"
      ? {
          plan: course,
          distanceAt: (seconds: number): number => course.at(seconds).distance,
        }
      : ArchetypeCourseLegs.plan(boat.archetype, course);
  const g: BoatOars.IGeometry = BoatOars.geometry(boat.dimensions);

  // The catches: where the distance covered reaches each whole stroke.
  const strokes: number = Math.floor(
    distanceAt(plan.duration) / rowBoat.STROKE + 1e-9,
  );
  const instants: { seconds: number; label: string }[] = [];
  for (let k: number = 1; k <= strokes; k++) {
    let low: number = 0;
    let high: number = plan.duration;
    for (let step: number = 0; step < 40; step++) {
      const middle: number = (low + high) / 2;
      if (distanceAt(middle) < k * rowBoat.STROKE) low = middle;
      else high = middle;
    }
    instants.push({ seconds: high, label: `catch${k}` });
  }

  const ease = (q: number): number => (1 - Math.cos(Math.PI * q)) / 2;
  const project: ReturnType<typeof AutoMovieArchetype.projection> =
    AutoMovieArchetype.projection(boat);
  const sea: AutoMovieArchetypeSea.ISea | undefined =
    options.sea === undefined
      ? undefined
      : AutoMovieArchetypeSea.of(options.sea);
  /** The root pose and sea do not depend on the articulated sockets. */
  const floated = (
    placement: IAutoMovieTransform,
    seconds: number,
  ): IAutoMovieTransform =>
    sea === undefined
      ? placement
      : AutoMovieArchetypeSea.floated(sea, placement, seconds);
  function sample(seconds: number): Sample;
  function sample(
    seconds: number,
    id: createBoat.Affordance,
  ): IAutoMovieTransform;
  function sample(
    seconds: number,
    ...socket: [] | [createBoat.Affordance]
  ): Sample | IAutoMovieTransform {
    const state: AutoMovieArchetypeCourse.IState = plan.at(seconds);
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
    const travels: Partial<Record<createBoat.Affordance, number>> = {
      leftOarlock: sweep,
      rightOarlock: sweep,
      leftOar: lift,
      rightOar: lift,
    };
    const selected: ReturnType<NonNullable<typeof project>> | undefined =
      project?.(AutoMovieArchetypeArticulation.travels(travels));
    let model: typeof boat | undefined =
      selected === undefined ? boat.articulate(travels) : undefined;
    const placement: IAutoMovieTransform = floated(state.placement, seconds);
    if (socket.length === 1) {
      const [id] = socket;
      const local: IAutoMovieTransform =
        selected?.frame(id) ??
        (model ?? boat.articulate(travels)).affordance(id).frame;
      return AutoMovieArchetypeFrame.compose(placement, local);
    }
    return {
      get archetype(): typeof boat {
        return model ?? boat.articulate(travels);
      },
      set archetype(value: typeof boat) {
        model = value;
      },
      placement,
      course: sea === undefined ? state : { ...state, placement },
    };
  }
  const ride: Ride = {
    plan,
    duration: plan.duration,
    instants: [...plan.instants, ...instants].sort(
      (a: { seconds: number }, b: { seconds: number }): number =>
        a.seconds - b.seconds,
    ),
    at: (seconds: number): Sample => sample(seconds),
    frame: (id: createBoat.Affordance, seconds: number): IAutoMovieTransform =>
      sample(seconds, id),
  };
  return {
    ...ride,
    rowing:
      course.kind !== "plan" && project !== undefined
        ? {
            boat,
            placement: (seconds: number): IAutoMovieTransform =>
              floated(plan.at(seconds).placement, seconds),
            frame: ride.frame,
            duration: ride.duration,
            stillEnd: sea === undefined,
          }
        : undefined,
  };
}

/** Companion constants and rules of {@link rowBoat}. */
export namespace rowBoat {
  /** A rowboat's ride with what `bind` reads of a native rowing course. */
  export interface IRowRide extends Ride {
    /**
     * The full samplers of a native course in course seconds, or undefined for
     * a ride along an external plan, which `bind` refuses.
     */
    readonly rowing: IRowing | undefined;
  }

  /** The full samplers of a native rowing course and its end hold. */
  export interface IRowing {
    /** The boat at rest. */
    readonly boat: AutoMovieArchetype<
      createBoat.Affordance,
      createBoat.Dimension
    >;

    /** The floated root placement at a course second. */
    readonly placement: (seconds: number) => IAutoMovieTransform;

    /** A socket's world frame at a course second. */
    readonly frame: Ride["frame"];

    /** The course's duration, seconds. */
    readonly duration: number;

    /** Whether the boat holds its final pose after the course: still water. */
    readonly stillEnd: boolean;
  }

  /**
   * Bind a native rowing course to the film second it starts. The boat holds
   * its initial pose until then. On still water it also holds its final
   * placement and every socket strictly beyond the course. Pass the two
   * returned callbacks directly to the prop adapter.
   *
   * @param ride The result of rowing a native course with this producer.
   * @param start Film second corresponding to course second zero.
   * @returns The independently callable root and socket readers in film
   *   seconds.
   * @throws {RangeError} For an unbound, external course or a nonfinite start.
   */
  export function bind(
    ride: IRowRide,
    start: number,
  ): RigidCarrierSample.IBinding {
    const source: IRowing | undefined = ride.rowing;
    if (source === undefined)
      throw new RangeError(
        "A bound rowboat needs a native course and a finite film second.",
      );
    const clock = (seconds: number): number => Math.max(0, seconds - start);
    const holds: RigidCarrierSample.IHold[] = [
      {
        from: -Infinity,
        to: start,
        contains: (seconds: number): boolean => clock(seconds) === 0,
      },
    ];
    if (source.stillEnd)
      holds.push({
        from: start + source.duration,
        to: Infinity,
        contains: (seconds: number): boolean =>
          clock(seconds) > source.duration,
      });
    return RigidCarrierSample.bind(
      source.boat,
      (seconds: number): ReturnType<RigidCarrierSample.IBinding["motion"]> => {
        const placement: IAutoMovieTransform = source.placement(clock(seconds));
        return {
          position: placement.translation,
          rotation: placement.rotation,
        };
      },
      (id: string, seconds: number): IAutoMovieTransform => {
        const affordance: createBoat.Affordance | undefined =
          createBoat.AFFORDANCES.find(
            (known: createBoat.Affordance): boolean => known === id,
          );
        if (affordance === undefined)
          throw new RangeError(`A boat has no affordance "${id}".`);
        return source.frame(affordance, clock(seconds));
      },
      holds,
    );
  }

  /**
   * The distance the boat covers each stroke, metres, a provisional value: no
   * source read gives a fixed-seat rowboat's; the source to read is a measured
   * distance per stroke of one, or one boat's speed and stroke rate measured
   * together. Searched for #3497 without a figure: fixed-seat distance per
   * stroke for skiffs, gigs and whalers; Cornish pilot gig stroke rate and
   * speed; Whitehall strokes a minute and knots (only guesses and marketing);
   * Navy whaleboat and cutter pulling drill; Agius et al. 2023, The Kinematics
   * of Fixed-Seat Rowing (Bioengineering 10(7):774), which measures the body
   * only; USNI Proceedings June 1890, Navy Boats, which gives no speed under
   * oars.
   */
  export const STROKE: number = 3;

  /**
   * The stroke rate's range inside which Kleshnev measured the drive's share,
   * strokes a minute (ISBS 1996, p. 321).
   */
  export const RATES: readonly [number, number] = [26, 36.5];

  /**
   * The stroke rate at a speed.
   *
   * @param speed The boat's speed, metres per second.
   * @returns Strokes a minute.
   */
  export function rate(speed: number): number {
    return (60 * speed) / STROKE;
  }

  /**
   * The drive's share of the stroke cycle at a stroke rate: Kleshnev's rhythm,
   * 0.84 r + 25.1 percent, the rate held inside the measured range.
   *
   * @param strokes The stroke rate, strokes a minute.
   * @returns The share, 0 to 1.
   */
  export function drive(strokes: number): number {
    const r: number = Math.min(Math.max(strokes, RATES[0]), RATES[1]);
    return (0.84 * r + 25.1) / 100;
  }
}

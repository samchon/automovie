import { RigidCarrierSample } from "@automovie/engine";
import type { IAutoMovieTransform } from "@automovie/interface";

import {
  Archetype,
  ArchetypeArticulation,
  type ArchetypeCourse,
  ArchetypeFrame,
  ArchetypeRefusal,
  type ArchetypeRide,
  ArchetypeSea,
} from "../core";
import { ArchetypeCourseLegs } from "../core/ArchetypeCourseLegs";
import { BoatOars } from "./BoatOars";
import type { createBoat } from "./createBoat";

/** Complete rowboat state at a film second. */
type Sample = ArchetypeRide.ISample<
  createBoat.Affordance,
  createBoat.Dimension
>;

/** A rowboat and its authored clock and articulation readers. */
type Ride = ArchetypeRide.IRide<createBoat.Affordance, createBoat.Dimension>;

/** The original full samplers and whether the course ends in a fixed pose. */
interface IBindingSource {
  boat: Archetype<createBoat.Affordance, createBoat.Dimension>;
  placement: (seconds: number) => IAutoMovieTransform;
  frame: Ride["frame"];
  duration: number;
  stillEnd: boolean;
  current: () => boolean;
}

/** Only this producer can issue the curve of a ride's own clock. */
const SOURCES: WeakMap<Ride, IBindingSource> = new WeakMap();

/**
 * A rowboat rowed along a course: its root on the path, its oars swept through the stroke cycle and lifted out of the water on the recovery, at a stroke rate the speed sets, on still water or a seeded sea.
 *
 * Each stroke is World Rowing's cycle (2015 media guide glossary, p. 12, https://d2cx26qpfwuhvu.cloudfront.net/worldrowing/wp-content/uploads/2020/12/04181521/GlossaryofRowingTerms_Neutral.pdf): the catch puts the blade in the water, the drive pulls it from the catch to the finish in the water, the finish takes it out, and the recovery carries it clear back to the catch. The boat covers `STROKE` metres a stroke, so the stroke rate is the speed over that, and the drive takes Kleshnev's share of the cycle at that rate. The oars sweep the `BoatOars.ARC`, easing in and out of each end; through the drive the blade sinks from the water's surface at the catch to its working depth and rises back to the surface at the finish, and through the recovery it lifts `BoatOars.CLEAR` above the water and comes down again. The ride's instants add `catch<k>` at each stroke's catch, so a rower's hands follow the handles as a cyclist's feet follow the pedals.
 *
 * Use `rowBoat.bind` to give a native ride one film start and pass its paired root and socket readers to the prop adapter. Both hold the initial pose before the start. On still water they also hold the final pose strictly after the course ends.
 *
 * @param boat The rowboat.
 * @param course The course its root follows, or its plan.
 * @param options `sea`, a sea the boat rides on (`ArchetypeSea`); still water when absent.
 * @returns The ride.
 * @throws {ArchetypeRefusal} When the boat has no oars, or as `ArchetypeCourse.plan` does for a malformed course.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the stroke cycle and its source, how the rate follows speed, what the oars do in each phase, and how a native ride can be bound to film time.
 * @evidence contracts/development/implementation.md#principled-implementation Strokes are counted by the distance covered, so a stroke's phase is the distance's fraction of `STROKE` and needs no integration; the drive's share is Kleshnev's rhythm at the stroke rate, 0.84 r + 25.1 percent with r in strokes a minute (ISBS 1996, p. 322, https://ojs.ub.uni-konstanz.de/cpa/article/view/2726/2573), its rate held inside the study's 26 to 36.5 strokes a minute. The sweep eases by half a cosine; the lift is the touch angle less a half sine of it through the drive and the touch angle plus a half sine of the rest of the clearance through the recovery, so the blade is below the water exactly between the catch and the finish.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Build the course and locate its catches, then read each pose and apply the sea. Keep native binding metadata beside the original ride's paired root and socket readers.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts `STROKE` is a named provisional value. Kleshnev's rhythm and the arc were read for sliding-seat boats, and the blade's feathering is not turned. A foreign plan gains no native binding.
 * @evidence contracts/development/implementation.md#efficient-algorithms One course sample per pose. Catch bisection reads distance forty times per catch once per ride. For a native course it reads the speed profile without evaluating the path or placement. The binding's root-only reader skips socket articulation.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Samples reuse the plan and oar geometry. The film binding shares the native clock across its original root and socket procedures and labels only proven stationary domains.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The ride owns the boat, plan and sea. Native ride and reader identities weakly own binding metadata. No prior sampled output is retained by the binding.
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
  const project: ReturnType<typeof Archetype.projection> =
    Archetype.projection(boat);
  const sea: ArchetypeSea.ISea | undefined =
    options.sea === undefined ? undefined : ArchetypeSea.of(options.sea);
  /** The root pose and sea do not depend on the articulated sockets. */
  const floated = (
    placement: IAutoMovieTransform,
    seconds: number,
  ): IAutoMovieTransform =>
    sea === undefined
      ? placement
      : ArchetypeSea.floated(sea, placement, seconds);
  function sample(seconds: number): Sample;
  function sample(
    seconds: number,
    id: createBoat.Affordance,
  ): IAutoMovieTransform;
  function sample(
    seconds: number,
    ...socket: [] | [createBoat.Affordance]
  ): Sample | IAutoMovieTransform {
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
    const travels: Partial<Record<createBoat.Affordance, number>> = {
      leftOarlock: sweep,
      rightOarlock: sweep,
      leftOar: lift,
      rightOar: lift,
    };
    const selected: ReturnType<NonNullable<typeof project>> | undefined =
      project?.(ArchetypeArticulation.travels(travels));
    let model: typeof boat | undefined =
      selected === undefined ? boat.articulate(travels) : undefined;
    const placement: IAutoMovieTransform = floated(state.placement, seconds);
    if (socket.length === 1) {
      const [id] = socket;
      const local: IAutoMovieTransform =
        selected?.frame(id) ??
        (model ?? boat.articulate(travels)).affordance(id).frame;
      return ArchetypeFrame.compose(placement, local);
    }
    return {
      get archetype(): typeof boat {
        model ??= boat.articulate(travels);
        return model;
      },
      set archetype(value: typeof boat) {
        model = value;
      },
      placement,
      course: sea === undefined ? state : { ...state, placement },
    };
  }
  const ride: ArchetypeRide.IRide<createBoat.Affordance, createBoat.Dimension> =
    {
      plan,
      duration: plan.duration,
      instants: [...plan.instants, ...instants].sort(
        (a: { seconds: number }, b: { seconds: number }): number =>
          a.seconds - b.seconds,
      ),
      at: (seconds: number): Sample => sample(seconds),
      frame: (
        id: createBoat.Affordance,
        seconds: number,
      ): IAutoMovieTransform => sample(seconds, id),
    };
  if (course.kind !== "plan" && project !== undefined) {
    const original: ArchetypeCourse.IPlan["at"] = plan.at;
    SOURCES.set(ride, {
      boat,
      placement: (seconds: number): IAutoMovieTransform =>
        floated(plan.at(seconds).placement, seconds),
      frame: ride.frame,
      duration: ride.duration,
      stillEnd: sea === undefined,
      current: (): boolean =>
        Object.getOwnPropertyDescriptor(plan, "at")?.value === original,
    });
  }
  return ride;
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
  /**
   * Bind a native rowing course to the film second it starts. The boat holds
   * its initial pose until then. On still water it also holds its final
   * placement and every socket strictly beyond the course. Pass the two
   * returned callbacks directly to the prop adapter.
   *
   * @param ride The result of rowing a native course with this producer.
   * @param start Film second corresponding to course second zero.
   * @returns The independently callable root and socket readers in film seconds.
   * @throws {RangeError} For an unbound, external course or a nonfinite start.
   */
  export function bind(ride: Ride, start: number): RigidCarrierSample.IBinding {
    const source: IBindingSource | undefined = SOURCES.get(ride);
    if (source === undefined || !Number.isFinite(start))
      throw new RangeError(
        "A bound rowboat needs a native course and a finite film second.",
      );
    const clock = (seconds: number): number => Math.max(0, seconds - start);
    const holds: RigidCarrierSample.IHold[] = [
      {
        from: -Infinity,
        to: start,
        contains: (seconds: number): boolean =>
          source.current() && clock(seconds) === 0,
      },
    ];
    if (source.stillEnd)
      holds.push({
        from: start + source.duration,
        to: Infinity,
        contains: (seconds: number): boolean =>
          source.current() && clock(seconds) > source.duration,
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
      (id: string, seconds: number): IAutoMovieTransform =>
        source.frame(id as createBoat.Affordance, clock(seconds)),
      holds,
    );
  }

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

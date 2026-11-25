import { AutoMovieGravity, projectileAt } from "@automovie/engine";
import type {
  IAutoMovieProjectile,
  IAutoMovieTransform,
} from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeRide,
} from "../core";
import type { createBicycle } from "./createBicycle";

/**
 * A bicycle ridden along a course: its root on the path, leaned into each turn,
 * its wheels rolling by distance and its crank following powered travel.
 *
 * One turn of the crank carries the bicycle the wheel's circumference times the
 * gear ratio (the development), so the crank's travel in degrees is 360 times
 * the distance over the development: the crank's angle integrates the path's
 * speed by the gear. The ride adds the instants `leftTopDeadCentre` and
 * `rightTopDeadCentre`, each time a crank arm passes straight up.
 *
 * @param bicycle The bicycle.
 * @param course The course its root follows, or its plan, such as a timed
 *   course's.
 * @param gear Teeth in use and optional freewheel intervals in course metres,
 *   such as a road coast or the stretches a bicycle is wheeled by hand. The
 *   default teeth are 34 and 17, a ratio of 2 from the compact road chainsets
 *   and 11 to 28 tooth cassettes Wikipedia's Bicycle gearing article lists
 *   (https://en.wikipedia.org/wiki/Bicycle_gearing). Omit coasting for
 *   fixed-drive behavior. UCI article 1.3.025 separates competition road and
 *   track drive equipment,
 *   https://www.uci.org/regulations/3MyLDDrwJCJJ0BGGOFzOat .
 * @returns The ride.
 * @throws {AutoMovieArchetypeRefusal} When a tooth count is not a positive
 *   whole number, a leg is reversed (a bicycle freewheels backward, so its
 *   crank would run back by the distance, which no rider does), a bend at the
 *   fastest the course lets it be taken needs more than `rideBicycle.LEAN`
 *   degrees of lean (as `AutoMovieArchetypeCourse.admitLean` refuses), or the
 *   course is malformed.
 */
export function rideBicycle(
  bicycle: AutoMovieArchetype<
    createBicycle.Affordance,
    createBicycle.Dimension
  >,
  course: AutoMovieArchetypeCourse.ICourse | AutoMovieArchetypeCourse.IPlan,
  gear: rideBicycle.IGear = {
    chainring: 34,
    sprocket: 17,
  },
): AutoMovieArchetypeRide.IRide<
  createBicycle.Affordance,
  createBicycle.Dimension
> {
  for (const [name, teeth] of [
    ["chainring", gear.chainring],
    ["sprocket", gear.sprocket],
  ] as const)
    if (!(teeth > 0))
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: "bicycle",
        axis: `gear.${name}`,
        value: teeth,
        feasible: { kind: "range", minimum: 1, maximum: null, unit: "" },
        reason: `a ${name} has a whole number of teeth, not ${teeth}`,
        fix: "give the tooth counts of the chainring and the sprocket",
      });
  const circumference: number = Math.PI * bicycle.dimensions.wheelDiameter!;
  const development: number = (circumference * gear.chainring) / gear.sprocket;

  // The crank turns with the distance, which runs one way only.
  const plan: AutoMovieArchetypeCourse.IPlan =
    course.kind === "plan"
      ? course
      : AutoMovieArchetypeCourse.plan("bicycle", course);
  if (plan.course.kind !== "timed")
    plan.course.legs.forEach(
      (leg: AutoMovieArchetypeCourse.Leg, index: number): void => {
        if (leg.reverse === true)
          throw new AutoMovieArchetypeRefusal({
            kind: "parameter",
            archetype: "bicycle",
            axis: `course.legs[${index}].reverse`,
            value: true,
            feasible: null,
            reason:
              "a bicycle freewheels backward, so its crank does not turn with a reversed leg",
            fix: "ride the leg forward, or wheel the bicycle by hand",
          });
      },
    );
  AutoMovieArchetypeCourse.admitLean("bicycle", plan, rideBicycle.LEAN);

  // One interval, or several in course order that do not overlap: a
  // bicycle wheeled by hand out of a transition and back into it coasts twice.
  const coasts: readonly rideBicycle.Interval[] =
    gear.coast === undefined
      ? []
      : single(gear.coast)
        ? [gear.coast]
        : gear.coast;
  coasts.forEach((coast: rideBicycle.Interval, index: number): void => {
    const previous: number = index === 0 ? 0 : coasts[index - 1]![1];
    if (
      !(coast[0] >= previous && coast[1] > coast[0] && coast[1] <= plan.length)
    )
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: "bicycle",
        axis: "gear.coast",
        value: gear.coast!,
        feasible: null,
        reason:
          "each freewheel interval must be ordered within the course, after the one before it",
        fix: "give increasing, non-overlapping pairs of course distances in metres",
      });
  });

  /** Distance of chain-driven travel up to a course position, metres. */
  const pedalled = (distance: number): number =>
    coasts.reduce(
      (driven: number, coast: rideBicycle.Interval): number =>
        driven -
        Math.min(coast[1] - coast[0], Math.max(0, distance - coast[0])),
      distance,
    );

  /** The course position at a distance of chain-driven travel, metres. */
  const position = (powered: number): number =>
    coasts.reduce(
      (distance: number, coast: rideBicycle.Interval): number =>
        distance > coast[0] ? distance + coast[1] - coast[0] : distance,
      powered,
    );

  // A crank arm is straight up every half turn: the left at whole turns, the right between them.
  const instants: rideBicycle.IInstant[] = [];
  for (let k: number = 1; (k * development) / 2 <= pedalled(plan.length); k++)
    instants.push({
      seconds: plan.when(position((k * development) / 2)),
      label: k % 2 === 0 ? "leftTopDeadCentre" : "rightTopDeadCentre",
    });
  for (const coast of coasts)
    instants.push(
      { seconds: plan.when(coast[0]), label: "coastStart" },
      { seconds: plan.when(coast[1]), label: "coastEnd" },
    );
  instants.sort(
    (left: rideBicycle.IInstant, right: rideBicycle.IInstant): number =>
      left.seconds - right.seconds,
  );
  return AutoMovieArchetypeRide.along(
    bicycle,
    plan,
    (
      state: AutoMovieArchetypeCourse.IState,
    ): AutoMovieArchetypeRide.IPose<
      createBicycle.Affordance,
      createBicycle.Dimension
    > => ({
      archetype: bicycle.articulate({
        crank: ((pedalled(state.distance) / development) * 360) % 360,
        frontSpin: ((state.distance / circumference) * 360) % 360,
        rearSpin: ((state.distance / circumference) * 360) % 360,
      }),
      placement: AutoMovieArchetypeCourse.banked(
        state,
        AutoMovieArchetypeCourse.lean(state),
      ),
    }),
    instants,
  );
}

/** Whether a coast is one interval rather than a list of them. */
function single(coast: rideBicycle.Coast): coast is rideBicycle.Interval {
  return typeof coast[0] === "number";
}

/**
 * The bicycle lean limit, the drive gear and an airborne take over a grounded
 * ride.
 */
export namespace rideBicycle {
  /**
   * The greatest lean, degrees: provisional. No figure for a bicycle was read
   * at a source; the road motorcycle's limit of `rideMotorcycle.LEAN` is taken
   * as the bound a narrower tyre does not exceed.
   */
  export const LEAN: number = 50;

  /** A stretch of the course from one distance to another, metres. */
  export type Interval = readonly [number, number];

  /** One freewheel interval, or several in course order without overlap. */
  export type Coast = Interval | readonly Interval[];

  /** The drive: the teeth in use and where the crank freewheels. */
  export interface IGear {
    /** Chainring teeth, a positive whole number. */
    chainring: number;

    /** Sprocket teeth, a positive whole number. */
    sprocket: number;

    /**
     * Course stretches over which the wheels roll and the crank holds its
     * phase: a road coast, or a bicycle wheeled by hand. Absent, the drive is
     * fixed.
     */
    coast?: Coast;
  }

  /** A labelled instant of the ride, film seconds from the course's clock. */
  export interface IInstant {
    /** Seconds. */
    seconds: number;

    /** What happens then. */
    label: string;
  }

  /**
   * Carry a bicycle through one level hop over a straight approach. The ground
   * course gives horizontal motion and wheel phase. The bicycle and every named
   * contact gain the same vertical ballistic displacement. At touchdown the
   * grounded course continues with its original pose and forward speed.
   *
   * Pass the returned ride to this function again to add a flight outside its
   * other hop intervals.
   *
   * @param ride The bicycle's course ride, with any previously composed hops.
   * @param interval Takeoff and touchdown film seconds on one level, forward
   *   straight leg travelled at constant positive speed.
   * @returns The same ride clock and drive with takeoff and touchdown instants.
   * @throws {AutoMovieArchetypeRefusal} When the interval lies outside the ride
   *   or overlaps one of its hops, the approach changes speed or direction, or
   *   the bicycle is off the level course at either boundary.
   */
  export function hop(
    ride: ReturnType<typeof rideBicycle>,
    interval: readonly [number, number],
  ): ReturnType<typeof rideBicycle> {
    const [takeoff, touchdown]: typeof interval = interval;
    if (takeoff < 0 || touchdown <= takeoff || touchdown > ride.duration)
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: "bicycle",
        axis: "hop.interval",
        value: interval,
        feasible: null,
        reason:
          "takeoff and touchdown must be increasing seconds within the ride",
        fix: "give two ordered instants on the bicycle's ride",
      });

    // The ride publishes each earlier flight as a takeoff and the touchdown
    // after it, so a copy of the ride carries its flights with its instants.
    let airborne: number | undefined;
    let overlap: readonly [number, number] | undefined;
    for (const event of ride.instants) {
      if (event.label === "takeoff") airborne = event.seconds;
      else if (event.label === "touchdown" && airborne !== undefined) {
        if (takeoff < event.seconds && airborne < touchdown)
          overlap ??= [airborne, event.seconds];
        airborne = undefined;
      }
    }
    if (overlap !== undefined)
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: "bicycle",
        axis: "hop.interval",
        value: interval,
        feasible: null,
        reason: `the bicycle is already airborne from ${overlap[0]} to ${overlap[1]} s`,
        fix: "choose a takeoff and touchdown outside its other flights",
      });

    const plan: AutoMovieArchetypeCourse.IPlan = ride.plan;
    const entry: AutoMovieArchetypeCourse.IState = plan.at(takeoff);
    const exit: AutoMovieArchetypeCourse.IState = plan.at(touchdown);
    const seconds: number = touchdown - takeoff;
    const legIndex: number = plan.legSpans.findIndex(
      (span: AutoMovieArchetypeCourse.ILegSpan): boolean =>
        entry.distance >= span.from && exit.distance <= span.from + span.span,
    );
    const leg: AutoMovieArchetypeCourse.Leg | undefined =
      plan.course.kind === "timed" ? undefined : plan.course.legs[legIndex];
    if (
      leg?.kind !== "straight" ||
      leg.reverse === true ||
      (leg.rise ?? 0) !== 0 ||
      entry.speed <= 0 ||
      Math.abs(exit.speed - entry.speed) > 1e-8 ||
      Math.abs(exit.distance - entry.distance - entry.speed * seconds) > 1e-8
    )
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: "bicycle",
        axis: "hop.approach",
        value: interval,
        feasible: null,
        reason:
          "a level hop needs a straight approach at constant forward speed",
        fix: "stage the complete hop within one level straight leg at cruising speed",
      });

    // The flight starts and ends on the course: the displayed bicycle sits
    // at the planned height and stands upright at both boundaries.
    const grounded = (film: number, floor: number): boolean => {
      const placement: IAutoMovieTransform = ride.at(film).placement;
      return (
        Math.abs(placement.translation.y - floor) <= 1e-8 &&
        Math.abs(AutoMovieArchetypeFrame.axis(placement, "y").y - 1) <= 1e-8
      );
    };
    if (
      !grounded(takeoff, entry.placement.translation.y) ||
      !grounded(touchdown, exit.placement.translation.y)
    )
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: "bicycle",
        axis: "hop.approach",
        value: interval,
        feasible: null,
        reason: "both hop boundaries must show a grounded and level bicycle",
        fix: "put the bicycle on the course at takeoff and touchdown",
      });

    const gravity: number = AutoMovieGravity.STANDARD;
    const flight: IAutoMovieProjectile = {
      origin: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: (gravity * seconds) / 2, z: 0 },
      gravity: { x: 0, y: -gravity, z: 0 },
    };

    /** Add the shared flight height while leaving the supported pose intact. */
    const lift = (
      placement: IAutoMovieTransform,
      film: number,
    ): IAutoMovieTransform => {
      if (film <= takeoff || film >= touchdown) return placement;
      const height: number = projectileAt(flight, film - takeoff).position.y;
      return {
        ...placement,
        translation: {
          ...placement.translation,
          y: placement.translation.y + height,
        },
      };
    };

    return {
      ...ride,
      instants: [
        ...ride.instants,
        { seconds: takeoff, label: "takeoff" },
        { seconds: touchdown, label: "touchdown" },
      ].sort(
        (
          left: (typeof ride.instants)[number],
          right: (typeof ride.instants)[number],
        ): number => left.seconds - right.seconds,
      ),
      at: (film: number): ReturnType<typeof ride.at> => {
        const sample: ReturnType<typeof ride.at> = ride.at(film);
        const placement: IAutoMovieTransform = lift(sample.placement, film);
        return placement === sample.placement
          ? sample
          : { ...sample, placement };
      },
      frame: (
        id: createBicycle.Affordance,
        film: number,
      ): IAutoMovieTransform => lift(ride.frame(id, film), film),
    };
  }
}

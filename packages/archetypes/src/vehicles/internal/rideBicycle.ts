import type {
  IAutoMovieTransform,
} from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeRide,
} from "../../core";
import type { AutoMovieArchetypeBicycle } from "../AutoMovieArchetypeBicycle";

/*
 * A bicycle ridden along a course: its root on the path, leaned into each turn,
 * its wheels rolling by distance and its crank following powered travel.
 *
 * One turn of the crank carries the bicycle the wheel's circumference times the
 * gear ratio (the development), so the crank's travel in degrees is 360 times
 * the distance over the development: the crank's angle integrates the path's
 * speed by the gear. The ride adds the instants `leftTopDeadCentre` and
 * `rightTopDeadCentre`, each time a crank arm passes straight up.
 * Parameter bicycle: The bicycle.
 * Parameter course: The course its root follows, or its plan, such as a timed
 * course's.
 * Parameter maximumLean: The admitted lean limit, in degrees.
 * Parameter gear: Teeth in use and optional freewheel intervals in course metres,
 * such as a road coast or the stretches a bicycle is wheeled by hand. The
 * default teeth are 34 and 17, a ratio of 2 from the compact road chainsets
 * and 11 to 28 tooth cassettes Wikipedia's Bicycle gearing article lists
 * (https://en.wikipedia.org/wiki/Bicycle_gearing). Omit coasting for
 * fixed-drive behavior. UCI article 1.3.025 separates competition road and
 * track drive equipment,
 * https://www.uci.org/regulations/3MyLDDrwJCJJ0BGGOFzOat .
 * Returns: The ride.
 * When a tooth count is not a positive
 * whole number, a leg is reversed (a bicycle freewheels backward, so its
 * crank would run back by the distance, which no rider does), a bend at the
 * fastest the course lets it be taken needs more than `maximumLean`
 * degrees of lean (as `AutoMovieArchetypeCourse.admitLean` refuses), or the
 * course is malformed.
 */
export function rideBicycle(
  bicycle: AutoMovieArchetype<
    AutoMovieArchetypeBicycle.Affordance,
    AutoMovieArchetypeBicycle.Dimension
  >,
  course: AutoMovieArchetypeCourse.ICourse | AutoMovieArchetypeCourse.IPlan,
  maximumLean: number,
  gear: AutoMovieArchetypeBicycle.IGear = {
    chainring: 34,
    sprocket: 17,
  },
): AutoMovieArchetypeRide.IRide<
  AutoMovieArchetypeBicycle.Affordance,
  AutoMovieArchetypeBicycle.Dimension
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
  AutoMovieArchetypeCourse.admitLean("bicycle", plan, maximumLean);

  // One interval, or several in course order that do not overlap: a
  // bicycle wheeled by hand out of a transition and back into it coasts twice.
  const coasts: readonly AutoMovieArchetypeBicycle.ICoastInterval[] =
    gear.coast === undefined
      ? []
      : single(gear.coast)
        ? [gear.coast]
        : gear.coast;
  coasts.forEach(
    (coast: AutoMovieArchetypeBicycle.ICoastInterval, index: number): void => {
      const previous: number = index === 0 ? 0 : coasts[index - 1]!.endMeters;
      if (
        !(
          coast.startMeters >= previous &&
          coast.endMeters > coast.startMeters &&
          coast.endMeters <= plan.length
        )
      )
        throw new AutoMovieArchetypeRefusal({
          kind: "parameter",
          archetype: "bicycle",
          axis: "gear.coast",
          value: gear.coast!,
          feasible: null,
          reason:
            "each coast span must increase in course order and start after the previous span",
          fix:
            "give startMeters and endMeters for each increasing, non-overlapping course span",
        });
    },
  );

  /*
   * Distance of chain-driven travel up to a course position, metres.
   */
  const pedalled = (distance: number): number =>
    coasts.reduce(
      (driven: number, coast: AutoMovieArchetypeBicycle.ICoastInterval): number =>
        driven -
        Math.min(
          coast.endMeters - coast.startMeters,
          Math.max(0, distance - coast.startMeters),
        ),
      distance,
    );

  /*
   * The course position at a distance of chain-driven travel, metres.
   */
  const position = (powered: number): number =>
    coasts.reduce(
      (distance: number, coast: AutoMovieArchetypeBicycle.ICoastInterval): number =>
        distance > coast.startMeters
          ? distance + coast.endMeters - coast.startMeters
          : distance,
      powered,
    );

  // A crank arm is straight up every half turn: the left at whole turns, the right between them.
  const instants: AutoMovieArchetypeBicycle.IRideInstant[] = [];
  for (let k: number = 1; (k * development) / 2 <= pedalled(plan.length); k++)
    instants.push({
      seconds: plan.when(position((k * development) / 2)),
      label: k % 2 === 0 ? "leftTopDeadCentre" : "rightTopDeadCentre",
    });
  for (const coast of coasts)
    instants.push(
      { seconds: plan.when(coast.startMeters), label: "coastStart" },
      { seconds: plan.when(coast.endMeters), label: "coastEnd" },
    );
  instants.sort(
    (left: AutoMovieArchetypeBicycle.IRideInstant, right: AutoMovieArchetypeBicycle.IRideInstant): number =>
      left.seconds - right.seconds,
  );
  return AutoMovieArchetypeRide.articulated(
    bicycle,
    plan,
    (
      state: AutoMovieArchetypeCourse.IState,
      _seconds: number,
      id?: AutoMovieArchetypeBicycle.Affordance,
    ): Partial<Record<AutoMovieArchetypeBicycle.Affordance, number>> => {
      const travels: Partial<
        Record<AutoMovieArchetypeBicycle.Affordance, number>
      > = {};
      if (
        id === undefined ||
        id === "crank" ||
        id === "leftPedal" ||
        id === "rightPedal"
      )
        travels.crank = ((pedalled(state.distance) / development) * 360) % 360;
      if (id === undefined || id === "frontSpin")
        travels.frontSpin = ((state.distance / circumference) * 360) % 360;
      if (id === undefined || id === "rearSpin")
        travels.rearSpin = ((state.distance / circumference) * 360) % 360;
      return travels;
    },
    {
      instants,
      placement: (
        state: AutoMovieArchetypeCourse.IState,
      ): IAutoMovieTransform =>
        AutoMovieArchetypeCourse.banked(
          state,
          AutoMovieArchetypeCourse.lean(state),
        ),
    },
  );
}

/*
 * Whether a coast value is one span rather than a list of spans.
 */
function single(
  coast: AutoMovieArchetypeBicycle.IRideCoast,
): coast is AutoMovieArchetypeBicycle.ICoastInterval {
  return !Array.isArray(coast);
}

/*
 * The bicycle lean limit, the drive gear and an airborne take over a grounded
 * ride.
 */
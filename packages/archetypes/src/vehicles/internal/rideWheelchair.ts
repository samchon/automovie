import type {

  IAutoMovieAffordance,
  IAutoMovieTransform,
} from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeRide,
} from "../../core";
import { CourseWheelTravel } from "../CourseWheelTravel";
import type { AutoMovieArchetypeWheelchair } from "../AutoMovieArchetypeWheelchair";
import { wheelchairHandrimFrame } from "./wheelchairHandrimFrame";

/**
 * A wheelchair moved along a course: its root on the path and its rear wheels,
 * with a self-propelled chair's handrims riding them, rolling with the
 * distance.
 *
 * The chair is pushed by an attendant at its handles or wheeled by its sitter.
 * The two rear wheels roll their signed centre travel plus or minus the track's
 * half-width times the heading change in radians. For a staged sitter's stroke,
 * pass the ride through `AutoMovieArchetypeWheelchair.handrimFrame` and register
 * `HumanHandrimStroke`.
 *
 * @param chair The wheelchair.
 * @param course The course its root follows, or its plan.
 * @returns The ride, with the course's instants.
 * @throws {AutoMovieArchetypeRefusal} As `AutoMovieArchetypeRide.along` does
 *   for a malformed course.
 */
export function rideWheelchair(
  chair: AutoMovieArchetype<
    AutoMovieArchetypeWheelchair.Affordance,
    AutoMovieArchetypeWheelchair.Dimension
  >,
  course: AutoMovieArchetypeCourse.ICourse | AutoMovieArchetypeCourse.IPlan,
): AutoMovieArchetypeRide.IRide<
  AutoMovieArchetypeWheelchair.Affordance,
  AutoMovieArchetypeWheelchair.Dimension
> {
  const circumference: number = Math.PI * chair.dimensions.wheelDiameter!;
  const halfTrack: number =
    (chair.affordance("leftSpin").frame.translation.x -
      chair.affordance("rightSpin").frame.translation.x) /
    2;
  const plan: AutoMovieArchetypeCourse.IPlan =
    course.kind === "plan"
      ? course
      : AutoMovieArchetypeCourse.plan("wheelchair", course);
  const heading: CourseWheelTravel.Reader =
    plan.course.kind === "timed"
      ? CourseWheelTravel.heading({ ...plan, course: plan.course })
      : CourseWheelTravel.legs(
          plan.legSpans,
          plan.course.legs.map(
            (leg: AutoMovieArchetypeCourse.Leg): number[] => [
              leg.kind === "turn" ? (leg.angle * Math.PI) / 180 : 0,
            ],
          ),
        );

  /** Signed tyre travel into the wheel's nonnegative knob range. */
  const spin = (travel: number): number =>
    ((((travel / circumference) * 360) % 360) + 360) % 360;
  return AutoMovieArchetypeRide.articulated(
    chair,
    plan,
    (
      state: AutoMovieArchetypeCourse.IState,
      seconds: number,
      id?: AutoMovieArchetypeWheelchair.Affordance,
    ): Partial<Record<AutoMovieArchetypeWheelchair.Affordance, number>> => {
      const left: boolean =
        id === undefined || id === "leftRim" || id === "leftSpin";
      const right: boolean =
        id === undefined || id === "rightRim" || id === "rightSpin";
      if (!left && !right) return {};
      const outside: number = halfTrack * heading(state, seconds)[0]!;
      return {
        ...(left ? { leftSpin: spin(state.progress - outside) } : {}),
        ...(right ? { rightSpin: spin(state.progress + outside) } : {}),
      };
    },
  );
}

/**
 * Repeated chair-relative hand contacts on one authored ride. Build the prop's
 * point reader once and register one HumanHandrimStroke for each engagement.
 * Use a bilateral catch for a straight push and a selected inside rim for a
 * turn braked around that wheel. See the observed inner and outer hand roles in
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC10293636/.
 */

export function handrimContacts(
  ride: ReturnType<typeof AutoMovieArchetypeWheelchair.ride>,
  holds: readonly AutoMovieArchetypeWheelchair.IHandrimHold[],
): ReturnType<typeof wheelchairHandrimFrame> {
  const wheels: readonly Rim[] = ["leftRim", "rightRim"];
  const byWheel: Record<Rim, IPreparedHold[]> = {
    leftRim: [],
    rightRim: [],
  };
  const rims: ReadonlySet<string> = new Set(
    ride
      .at(0)
      .archetype.affordances.filter(
        ({ kind }: IAutoMovieAffordance): boolean => kind === "wheel",
      )
      .map(({ id }: IAutoMovieAffordance): string => id),
  );
  for (const hold of [...holds].sort(
    (
      a: AutoMovieArchetypeWheelchair.IHandrimHold,
      b: AutoMovieArchetypeWheelchair.IHandrimHold,
    ): number => a.catchAt - b.catchAt,
  )) {
    if (
      hold.catchAt < 0 ||
      hold.catchAt > ride.duration ||
      !(hold.catchAt < hold.releaseAt) ||
      Math.abs(hold.degrees) > 180 ||
      (hold.side !== undefined &&
        hold.side !== "left" &&
        hold.side !== "right")
    )
      refuse(
        hold,
        "a hold needs an admitted catch, later finite release, angle and side",
      );

    const selected: readonly Rim[] =
      hold.side === undefined
        ? wheels
        : [hold.side === "left" ? "leftRim" : "rightRim"];
    const read: ReturnType<typeof wheelchairHandrimFrame> =
      wheelchairHandrimFrame(ride, hold.catchAt, hold.degrees);
    for (const rim of selected) {
      if (!rims.has(rim)) refuse(hold, "the chair has no rim at " + rim);
      const windows: IPreparedHold[] = byWheel[rim];
      const prior: IPreparedHold | undefined = windows.at(-1);
      if (prior !== undefined && hold.catchAt <= prior.to)
        refuse(hold, "material selections on " + rim + " overlap");
      windows.push({ from: hold.catchAt, to: hold.releaseAt, read });
    }
  }

  return (
    id: AutoMovieArchetypeWheelchair.Affordance,
    seconds: number,
  ): IAutoMovieTransform => {
    if (id === "leftRim" || id === "rightRim") {
      const windows: readonly IPreparedHold[] = byWheel[id];
      let start: number = 0;
      let stop: number = windows.length;
      while (start < stop) {
        const at: number = Math.floor((start + stop) / 2);
        const window: IPreparedHold = windows[at]!;
        if (seconds < window.from) stop = at;
        else if (seconds > window.to) start = at + 1;
        else return window.read(id, seconds);
      }
    }
    return ride.frame(id, seconds);
  };
}


/** Which of a wheelchair's rim frames a sitter engages. */
type Rim = "leftRim" | "rightRim";

/** A selected material point on a closed interval of the ride clock. */
interface IPreparedHold {
  /** The selected catch second, included. */
  from: number;
  /** The selected release second, included. */
  to: number;
  /** Read the selected wheel material point in the world frame. */
  read: ReturnType<typeof wheelchairHandrimFrame>;
}

/** Explain which of the staged holds must change. */
function refuse(hold: AutoMovieArchetypeWheelchair.IHandrimHold, reason: string): never {
  throw new AutoMovieArchetypeRefusal({
    kind: "parameter",
    archetype: "wheelchair",
    axis: "handrims",
    value: hold,
    feasible: null,
    reason,
    fix: "give separate catch and release intervals for the available rims",
  });
}

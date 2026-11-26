import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieTransform,
} from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeRide,
} from "../core";
import { CourseWheelTravel } from "./CourseWheelTravel";
import type { createWheelchair } from "./createWheelchair";
import { wheelchairHandrimFrame } from "./wheelchairHandrimFrame";

/**
 * A wheelchair moved along a course: its root on the path and its rear wheels,
 * with a self-propelled chair's handrims riding them, rolling with the
 * distance.
 *
 * The chair is pushed by an attendant at its handles or wheeled by its sitter.
 * The two rear wheels roll their signed centre travel plus or minus the track's
 * half-width times the heading change in radians. For a staged sitter's stroke,
 * pass the ride through `wheelchairHandrimFrame` and register
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
    createWheelchair.Affordance,
    createWheelchair.Dimension
  >,
  course: AutoMovieArchetypeCourse.ICourse | AutoMovieArchetypeCourse.IPlan,
): AutoMovieArchetypeRide.IRide<
  createWheelchair.Affordance,
  createWheelchair.Dimension
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
      id?: createWheelchair.Affordance,
    ): Partial<Record<createWheelchair.Affordance, number>> => {
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
export namespace rideWheelchair {
  /**
   * One material point selected for a closed interval on the ride clock. Two
   * intervals on the same rim cannot share an endpoint.
   */
  export interface IHandrimHold {
    /** The second on the ride clock when the hand first meets the rim. */
    catchAt: number;

    /**
     * The last contact second on the same clock. The hand may still hold after
     * the chair stops.
     */
    releaseAt: number;

    /** The catch angle in degrees from chair up, positive toward its front. */
    degrees: number;

    /** The acting hand; omission selects both rims. */
    side?: AutoMovieHumanSide;
  }

  /**
   * Build the prop's contact callback for successive strokes on one ride.
   *
   * @param ride The chair ride. Contact times use the same clock as its
   *   placement.
   * @param holds The authored contact intervals, including their catch angles.
   *   Input order is immaterial.
   * @returns A point reader that follows one rim material point per active
   *   hand. Other contacts read the ride's usual frame.
   * @throws {AutoMovieArchetypeRefusal} If a window has invalid times, angle or
   *   side, if the chair lacks the selected rim, or if two windows select the
   *   same rim at a common second.
   *
   *   Prepares chronologically ordered windows for each rim. The existing
   *   single-catch reader resolves each selected point into wheel coordinates
   *   once. Playback searches that rim's windows and samples only its active
   *   selection. The callback retains the ride and the prepared windows.
   */
  export function handrimContacts(
    ride: ReturnType<typeof rideWheelchair>,
    holds: readonly IHandrimHold[],
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
        a: rideWheelchair.IHandrimHold,
        b: rideWheelchair.IHandrimHold,
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
      id: createWheelchair.Affordance,
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
function refuse(hold: rideWheelchair.IHandrimHold, reason: string): never {
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

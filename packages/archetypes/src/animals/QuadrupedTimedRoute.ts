import { AutoMovieArchetypeCourse } from "../core";
import { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";
import type { QuadrupedRideClock } from "./QuadrupedRideClock";
import { QuadrupedTimedCues } from "./QuadrupedTimedCues";
import type { AutoMovieArchetypeQuadruped } from "./AutoMovieArchetypeQuadruped";

/**
 * The route a quadruped ride follows: an authored course of legs, or a planned
 * course such as a timed one ridden as given.
 */
export namespace QuadrupedTimedRoute {
  /** A ride's admitted route. */
  export interface IRoute {
    /** The plan the ride samples. */
    plan: AutoMovieArchetypeCourse.IPlan;
    /** The course of legs its admission and clock read. */
    course: AutoMovieArchetypeQuadruped.IRideCourse;

    /**
     * Each timed halt from its stop to the next departure, which holds the hoof
     * clock; none for a course of legs.
     */
    holds: QuadrupedRideClock.IHold[];
  }

  /**
   * Admit a route: plan an authored course, or read a planned one with its
   * halts, restarts and stop ramps.
   *
   * @param species The ride's species and table.
   * @param route The authored course, a planned course, or a planned course
   *   with named-gait cues (`QuadrupedTimedCues`).
   * @param withers The animal's withers height, metres.
   * @param gait The ride's fixed gait, which names every leg naming none.
   * @returns The plan and its course of legs.
   * @throws {AutoMovieArchetypeRefusal} As AutoMovieArchetypeCourse.plan
   *   refuses a malformed course.
   */
  export function of(
    species: AutoMovieArchetypeQuadruped.ISpecies,
    route:
      | AutoMovieArchetypeQuadruped.IRideCourse
      | AutoMovieArchetypeCourse.IPlan
      | QuadrupedTimedCues.ICued,
    withers: number,
    gait?: AutoMovieArchetypeQuadrupedGait.Gait,
  ): IRoute {
    // The ride's fixed gait names every leg that names none, so each leg states whether its gait is requested or chosen by speed.
    if (gait !== undefined) {
      const named: IRoute = of(species, route, withers);
      return {
        ...named,
        course: {
          ...named.course,
          legs: named.course.legs.map(
            (leg: AutoMovieArchetypeQuadruped.IRideLeg): AutoMovieArchetypeQuadruped.IRideLeg =>
              leg.gait === undefined ? { ...leg, gait } : leg,
          ),
        },
      };
    }
    // A cued timed path is its plan's route with its legs named at the cues.
    if (route.kind === "cued")
      return QuadrupedTimedCues.split(
        of(species, route.plan, withers),
        route.cues,
        species.archetype,
      );
    // A timed plan is ridden as given: one leg naming no gait, so each stride's
    // gait follows the plan's speed, and one span at the plan's peak, so the
    // speed admission covers its fastest second.
    // Its halts and restarts at zero-speed marks become `stop<k>` and
    // `depart<k>` instants, and its ramps through the slowest gait's least speed
    // set the rate whose vMin^2/(2a) bridge the clock already keeps for a stop.
    const least: number = AutoMovieArchetypeQuadrupedGait.range(
      species,
      species.table.order[0]!,
      withers,
    ).minimum;
    const halts: AutoMovieArchetypeCourse.IPlan["instants"][number][] = [];
    let ramp: number = Infinity;
    if (route.kind === "plan" && route.course.kind === "timed")
      route.course.samples.forEach(
        (mark: AutoMovieArchetypeCourse.ISample, k: number): void => {
          if (route.at(mark.seconds).speed !== 0) return;
          for (const [label, sign] of [
            ["stop", -1],
            ["depart", 1],
          ] as const) {
            const near: number = mark.seconds + sign * 1e-6;
            if (near < 0 || near > route.duration || route.at(near).speed === 0)
              continue;
            let edge: number = mark.seconds;
            while (
              edge + sign * 0.01 >= 0 &&
              edge + sign * 0.01 <= route.duration &&
              route.at(edge + sign * 0.01).speed < least
            )
              edge += sign * 0.01;
            const span: number = Math.abs(
              route.at(edge + sign * 0.01).distance -
                route.at(mark.seconds).distance,
            );
            if (span > 0) ramp = Math.min(ramp, least ** 2 / (2 * span));
            halts.push({ seconds: mark.seconds, label: `${label}${k}` });
          }
        },
      );
    // The second a plan that begins standing first departs; its start otherwise.
    const departs: number =
      route.kind === "plan" &&
      route.at(route.when(0) + 1e-6).speed === 0 &&
      halts.some(
        (halt: AutoMovieArchetypeCourse.IPlan["instants"][number]): boolean =>
          halt.label.startsWith("depart"),
      )
        ? halts.find(
            (
              halt: AutoMovieArchetypeCourse.IPlan["instants"][number],
            ): boolean => halt.label.startsWith("depart"),
          )!.seconds
        : route.kind === "plan"
          ? route.when(0)
          : 0;
    const plan: AutoMovieArchetypeCourse.IPlan =
      route.kind === "plan"
        ? route.legSpans.length > 0
          ? route
          : {
              ...route,
              instants: [...route.instants, ...halts].sort(
                (
                  a: AutoMovieArchetypeCourse.IPlan["instants"][number],
                  b: AutoMovieArchetypeCourse.IPlan["instants"][number],
                ): number => a.seconds - b.seconds,
              ),
              legSpans: [{ from: 0, span: route.length, fastest: route.peak }],

              // A plan that begins standing leaves its start at its first
              // departure, as a course of legs leaves at its start second.
              ...(departs > route.when(0)
                ? {
                    when: (distance: number): number =>
                      distance <= 0 ? departs : route.when(distance),
                  }
                : {}),
            }
        : AutoMovieArchetypeCourse.plan(species.archetype, route);
    const course: AutoMovieArchetypeQuadruped.IRideCourse =
      route.kind === "plan"
        ? {
            start: {
              x: route.at(0).placement.translation.x,
              z: route.at(0).placement.translation.z,
              heading: 0,
            },
            legs: [{ kind: "straight", length: Math.max(route.length, 1e-9) }],
            ...(route.at(route.when(0)).speed === 0
              ? { startFromStanding: true as const }
              : {}),
            cruise: Math.max(route.peak, 1e-9),
            ...(ramp === Infinity
              ? {}
              : { acceleration: ramp, deceleration: ramp }),
          }
        : route;
    const holds: QuadrupedRideClock.IHold[] = [];
    halts.forEach(
      (
        halt: AutoMovieArchetypeCourse.IPlan["instants"][number],
        k: number,
      ): void => {
        if (
          halt.label.startsWith("stop") &&
          k + 1 < halts.length &&
          halts[k + 1]!.label.startsWith("depart")
        )
          holds.push({
            start: halt.seconds,
            duration: halts[k + 1]!.seconds - halt.seconds,
          });
      },
    );
    return { plan, course, holds };
  }
}

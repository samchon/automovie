import { ArchetypeCourse } from "../core";
import { QuadrupedGait } from "./QuadrupedGait";
import type { createQuadruped } from "./createQuadruped";
import type { rideQuadruped } from "./rideQuadruped";

/**
 * The route a quadruped ride follows: an authored course of legs, or a planned course such as a timed one ridden as given.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two route forms and how a timed plan is read.
 * @evidence contracts/development/design.md#principled-representation The admitted plan and the course of legs the ride's admission and clocks read.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by 
ideQuadruped, kept apart for its size.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace QuadrupedTimedRoute {
  /**
   * A ride's admitted route.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both members.
   * @evidence contracts/development/design.md#principled-representation The plan and its course of legs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by of.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IRoute {
    /** The plan the ride samples. */
    plan: ArchetypeCourse.IPlan;
    /** The course of legs its admission and clock read. */
    course: rideQuadruped.ICourse;
  }

  /**
   * Admit a route: plan an authored course, or read a planned one with its halts, restarts and stop ramps.
   *
   * @param species The ride's species and table.
   * @param route The authored course or a planned course.
   * @param withers The animal's withers height, metres.
   * @returns The plan and its course of legs.
   * @throws {ArchetypeRefusal} As ArchetypeCourse.plan refuses a malformed course.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation A timed plan becomes one leg naming no gait at its peak speed; its zero-speed marks become stop and depart instants, and the shortest ramp through the slowest gait's least speed sets the rate of the clock's stop bridge.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the halts, then build the plan and the course.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None; the plan is ridden as given.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(K) marks, each with a 10 ms scan of its ramp.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the plan's samplers and ArchetypeCourse.plan.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the plan and a small course.
   */
  export function of(
    species: createQuadruped.ISpecies,
    route: rideQuadruped.ICourse | ArchetypeCourse.IPlan,
    withers: number,
  ): IRoute {
    // A timed plan is ridden as given: one leg naming no gait, so each stride's
    // gait follows the plan's speed, and one span at the plan's peak, so the
    // speed admission covers its fastest second.
    // Its halts and restarts at zero-speed marks become `stop<k>` and
    // `depart<k>` instants, and its ramps through the slowest gait's least speed
    // set the rate whose vMin^2/(2a) bridge the clock already keeps for a stop.
    const least: number = QuadrupedGait.range(
      species,
      species.table.order[0]!,
      withers,
    ).minimum;
    const halts: ArchetypeCourse.IPlan["instants"][number][] = [];
    let ramp: number = Infinity;
    if (route.kind === "plan" && route.course.kind === "timed")
      route.course.samples.forEach(
        (mark: ArchetypeCourse.ISample, k: number): void => {
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
    const plan: ArchetypeCourse.IPlan =
      route.kind === "plan"
        ? route.legSpans.length > 0
          ? route
          : {
              ...route,
              instants: [...route.instants, ...halts].sort(
                (
                  a: ArchetypeCourse.IPlan["instants"][number],
                  b: ArchetypeCourse.IPlan["instants"][number],
                ): number => a.seconds - b.seconds,
              ),
              legSpans: [{ from: 0, span: route.length, fastest: route.peak }],
            }
        : ArchetypeCourse.plan(species.archetype, route);
    const course: rideQuadruped.ICourse =
      route.kind === "plan"
        ? {
            start: {
              x: route.at(0).placement.translation.x,
              z: route.at(0).placement.translation.z,
              heading: 0,
            },
            legs: [{ kind: "straight", length: Math.max(route.length, 1e-9) }],
            cruise: Math.max(route.peak, 1e-9),
            ...(ramp === Infinity
              ? {}
              : { acceleration: ramp, deceleration: ramp }),
          }
        : route;
    return { plan, course };
  }
}

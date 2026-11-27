import {
  type AutoMovieArchetypeCourse,
  AutoMovieArchetypeRefusal,
} from "../core";
import type { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";
import type { QuadrupedTimedRoute } from "./QuadrupedTimedRoute";
import type { AutoMovieArchetypeQuadruped } from "./AutoMovieArchetypeQuadruped";

/**
 * A rider's or a cue's named-gait requests on a timed path: over each
 * film-second interval the ride takes the named gait and lead, as a course leg
 * naming them does; elsewhere the declared change rule chooses by speed.
 */
export namespace QuadrupedTimedCues {
  /** One named-gait request. */
  export interface ICue {
    /** The film second the request begins. */
    from: number;
    /** The film second it ends, after from. */
    to: number;
    /** The gait asked for. */
    gait: AutoMovieArchetypeQuadrupedGait.Gait;
    /** The lead of a leaded gait; the left when absent. */
    lead?: AutoMovieArchetypeQuadrupedGait.Lead;
  }

  /** A timed path with its cues. */
  export interface ICued {
    /** Discriminant of a cued route among a ride's routes. */
    kind: "cued";

    /** The planned course, such as `AutoMovieArchetypeCourse.timed`'s. */
    plan: AutoMovieArchetypeCourse.IPlan;
    /** The requests, in order and not overlapping. */
    cues: readonly ICue[];
  }

  /**
   * Split a timed route's one leg at its cues' distances, naming each cued
   * leg's gait and lead.
   *
   * @param route The route `QuadrupedTimedRoute.of` read from the plan.
   * @param cues The requests.
   * @param archetype The archetype's name, for a refusal.
   * @returns The route with one leg per cued or uncued stretch, and its leg
   *   spans with each stretch's fastest speed.
   * @throws {AutoMovieArchetypeRefusal} For a cue that is not finite, is empty,
   *   runs backward or overlaps the one before.
   */
  export function split(
    route: QuadrupedTimedRoute.IRoute,
    cues: readonly ICue[],
    archetype: string,
  ): QuadrupedTimedRoute.IRoute {
    const plan: AutoMovieArchetypeCourse.IPlan = route.plan;
    const cuts: ICut[] = [];
    let last: number = -Infinity;
    for (const cue of cues) {
      if (!(cue.to > cue.from) || cue.from < last)
        throw new AutoMovieArchetypeRefusal({
          kind: "parameter",
          archetype,
          axis: "course",
          value: cue.from,
          feasible: null,
          reason: `the ${cue.gait} cue from ${cue.from} s to ${cue.to} s is empty, runs backward or overlaps the cue before it`,
          fix: "Give each cue a later end than its start, in order, without overlap.",
        });
      last = cue.to;
      cuts.push({
        from: distance(plan, cue.from),
        to: distance(plan, cue.to),
        cue,
      });
    }
    const legs: AutoMovieArchetypeQuadruped.IRideLeg[] = [];
    const spans: AutoMovieArchetypeCourse.IPlan["legSpans"][number][] = [];
    let at: number = 0;
    const add = (to: number, cue?: ICue): void => {
      if (!(to > at)) return;
      legs.push({
        kind: "straight",
        length: to - at,
        ...(cue === undefined ? {} : { gait: cue.gait }),
        ...(cue?.lead === undefined ? {} : { lead: cue.lead }),
      });
      spans.push({ from: at, span: to - at, fastest: fastest(plan, at, to) });
      at = to;
    };
    for (const cut of cuts) {
      add(cut.from);
      add(cut.to, cut.cue);
    }
    add(plan.length);
    return {
      ...route,
      plan: { ...plan, legSpans: spans },
      course: { ...route.course, legs },
    };
  }

  /** A cue at its plan distances. */
  interface ICut {
    /** Distance where it begins, metres. */
    from: number;
    /** Distance where it ends, metres. */
    to: number;
    /** The cue. */
    cue: ICue;
  }

  /** The plan's distance at a film second, within its length. */
  function distance(
    plan: AutoMovieArchetypeCourse.IPlan,
    seconds: number,
  ): number {
    return Math.max(0, Math.min(plan.length, plan.at(seconds).distance));
  }

  /** The fastest speed over a stretch of the plan, scanned every 10 ms. */
  function fastest(
    plan: AutoMovieArchetypeCourse.IPlan,
    from: number,
    to: number,
  ): number {
    const end: number = plan.when(to);
    let top: number = 0;
    for (let s: number = plan.when(from); s < end; s += 0.01)
      top = Math.max(top, plan.at(s).speed);
    return Math.max(top, plan.at(end).speed, 1e-9);
  }
}

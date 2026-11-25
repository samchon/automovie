import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieArchetypeCourse } from "./AutoMovieArchetypeCourse";
import type { AutoMovieArchetypeManoeuvre } from "./AutoMovieArchetypeManoeuvre";
import { AutoMovieArchetypeRefusal } from "./AutoMovieArchetypeRefusal";
import { AutoMovieArchetypeUnits } from "./AutoMovieArchetypeUnits";

/**
 * An oval racecourse run counter-clockwise with the inner rail on the runners'
 * left: two straights joined by two semicircular turns, and a runner's race
 * plan of lane and speed over distance turned into a timed path.
 *
 * Distance is measured along the rail from the start of the home straight. A
 * runner `offset` metres out from the rail keeps the rail's distance parameter,
 * so on a turn it covers `(radius + offset) / radius` times the ground the rail
 * does.
 */
export namespace AutoMovieArchetypeOval {
  /** An oval's layout. */
  export interface IOval {
    /** The infield's middle on the floor, world metres. */
    centre: IAutoMovieVector3;

    /** The home straight's running direction, degrees about `+Y` from `+Z`. */
    heading: number;

    /** Each straight's length, metres, positive. */
    straight: number;

    /** The rail's radius on each turn, metres, positive. */
    radius: number;
  }

  /** One mark of a race plan. */
  export interface IMark {
    /** The rail distance of the mark, metres. */
    distance: number;

    /** The runner's distance out from the rail there, metres, at least 0. */
    offset: number;

    /** The runner's pace along the rail there, metres per second, positive. */
    speed: number;
  }

  /**
   * The oval about the origin of a lap at a turn radius, its home straight
   * toward `+Z`: the straights take what the two turns leave of the lap.
   *
   * @param lap The rail's length once round, metres, more than a full circle of
   *   the radius.
   * @param radius The rail's radius on each turn, metres, positive.
   * @returns The oval.
   */
  export function lapped(lap: number, radius: number): IOval {
    return {
      centre: { x: 0, y: 0, z: 0 },
      heading: 0,
      straight: (lap - 2 * Math.PI * radius) / 2,
      radius,
    };
  }

  /**
   * The rail's length once round, metres.
   *
   * @param oval The oval.
   * @returns Two straights and a full circle of the rail's radius.
   */
  export function length(oval: IOval): number {
    return 2 * oval.straight + 2 * Math.PI * oval.radius;
  }

  /**
   * The floor point at a rail distance and an offset out from the rail.
   *
   * @param oval The oval.
   * @param distance The rail distance, metres, taken round the oval.
   * @param offset The distance out from the rail, metres.
   * @returns The world point.
   */
  export function point(
    oval: IOval,
    distance: number,
    offset: number,
  ): IAutoMovieVector3 {
    const total: number = length(oval);
    const s: number = ((distance % total) + total) % total;
    const half: number = oval.straight / 2;
    const out: number = oval.radius + offset;
    const turn: number = Math.PI * oval.radius;

    // In the oval's frame: `a` ahead along the home straight, `b` to the runner's left, toward the infield.
    let a: number;
    let b: number;
    if (s < oval.straight) {
      a = -half + s;
      b = -out;
    } else if (s < oval.straight + turn) {
      const angle: number = (s - oval.straight) / oval.radius;
      a = half + out * Math.sin(angle);
      b = -out * Math.cos(angle);
    } else if (s < 2 * oval.straight + turn) {
      a = half - (s - oval.straight - turn);
      b = out;
    } else {
      const angle: number = (s - 2 * oval.straight - turn) / oval.radius;
      a = -half - out * Math.sin(angle);
      b = out * Math.cos(angle);
    }
    const h: number = oval.heading * AutoMovieArchetypeUnits.DEGREE;
    const left: number = h + Math.PI / 2;
    return {
      x: oval.centre.x + a * Math.sin(h) + b * Math.sin(left),
      y: oval.centre.y,
      z: oval.centre.z + a * Math.cos(h) + b * Math.cos(left),
    };
  }

  /**
   * Points on the rail every `spacing` metres of it once round, the first at
   * the home straight's start.
   *
   * @param oval The oval.
   * @param spacing The distance between points, metres, positive; the last
   *   stretch is shorter when it does not divide the length.
   * @returns The points, without repeating the first.
   */
  export function rail(oval: IOval, spacing: number): IAutoMovieVector3[] {
    const points: IAutoMovieVector3[] = [];
    for (let s: number = 0; s < length(oval) - 1e-9; s += spacing)
      points.push(point(oval, s, 0));
    return points;
  }

  /**
   * A runner's timed path from its race plan: lane offset and pace each linear
   * in rail distance between marks.
   *
   * @param archetype The name a refusal carries.
   * @param oval The oval.
   * @param marks The plan, at least two marks with increasing distances.
   * @param start The film second the runner is at the first mark.
   * @param step Seconds between samples, positive.
   * @param range The gallop's admitted ground speeds.
   * @returns The samples from the first mark to the last.
   * @throws {AutoMovieArchetypeRefusal} On `marks[i]` for a distance not after
   *   the one before, a negative offset, or a pace whose ground speed, on a
   *   turn at that offset, leaves the range, giving the paces the range allows
   *   there.
   */
  export function lane(
    archetype: string,
    oval: IOval,
    marks: readonly IMark[],
    start: number,
    step: number,
    range: AutoMovieArchetypeManoeuvre.ISpeedRange,
  ): AutoMovieArchetypeCourse.ISample[] {
    marks.forEach((mark: IMark, i: number): void => {
      const widest: number = (oval.radius + mark.offset) / oval.radius;
      const refuse: (reason: string) => never = (reason: string): never => {
        throw new AutoMovieArchetypeRefusal({
          kind: "parameter",
          archetype,
          axis: `marks[${i}]`,
          value: mark,
          feasible: {
            kind: "range",
            minimum: range.minimum,
            maximum: range.maximum / widest,
            unit: "m/s",
          },
          reason,
          fix: "keep each mark after the one before, on or outside the rail, at a pace the gallop keeps",
        });
      };
      if (i > 0 && !(mark.distance > marks[i - 1]!.distance))
        refuse(`mark ${i} at ${mark.distance} m is not after the one before`);
      if (!(mark.offset >= 0))
        refuse(`an offset of ${mark.offset} m is inside the rail`);
      if (
        !(mark.speed >= range.minimum && mark.speed * widest <= range.maximum)
      )
        refuse(
          `a pace of ${mark.speed} m/s at ${mark.offset} m out runs ${mark.speed * widest} m/s on a turn, outside the gallop's ${range.minimum} to ${range.maximum} m/s`,
        );
    });

    // The film second each mark is reached.
    const reach: number[] = [start];
    for (let i: number = 1; i < marks.length; ++i) {
      const a: IMark = marks[i - 1]!;
      const b: IMark = marks[i]!;
      const span: number = b.distance - a.distance;
      reach.push(
        reach[i - 1]! +
          (b.speed === a.speed
            ? span / a.speed
            : (span * Math.log(b.speed / a.speed)) / (b.speed - a.speed)),
      );
    }
    const end: number = reach[reach.length - 1]!;
    const at: (seconds: number) => AutoMovieArchetypeCourse.ISample = (
      seconds: number,
    ): AutoMovieArchetypeCourse.ISample => {
      let i: number = 0;
      while (i + 2 < reach.length && reach[i + 1]! <= seconds) ++i;
      const a: IMark = marks[i]!;
      const b: IMark = marks[i + 1]!;
      const t: number = seconds - reach[i]!;
      const k: number = (b.speed - a.speed) / (b.distance - a.distance);
      const along: number =
        k === 0 ? a.speed * t : (a.speed * (Math.exp(k * t) - 1)) / k;
      const u: number = Math.min(1, along / (b.distance - a.distance));
      const placed: IAutoMovieVector3 = point(
        oval,
        a.distance + along,
        a.offset + (b.offset - a.offset) * u,
      );
      return { seconds, x: placed.x, y: placed.y, z: placed.z };
    };
    const samples: AutoMovieArchetypeCourse.ISample[] = [];
    for (let k: number = 0; start + k * step < end; ++k)
      samples.push(at(start + k * step));
    samples.push(at(end));
    return samples;
  }
}

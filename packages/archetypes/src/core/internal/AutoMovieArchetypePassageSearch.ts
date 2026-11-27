import { AutoMovieEngineQuaternion, AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieCrowdAgent,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieArchetypeCourse } from "../AutoMovieArchetypeCourse";
import type { AutoMovieArchetypePassage } from "../AutoMovieArchetypePassage";
import { AutoMovieArchetypeRefusal } from "../AutoMovieArchetypeRefusal";

/*
 * Admission, footprint distances and interval search for passage conflicts.
 */
export namespace AutoMovieArchetypePassageSearch {
  /*
   * Where a steering obstacle stands at a second: its world position and its yaw
   * in degrees.
   */
  export type IObstaclePlacement = ReturnType<
    NonNullable<IAutoMovieCrowdAgent.IObstacle["motion"]>
  >;

  /*
   * Halvings that place an interval's end, and golden-section steps that place a
   * minimum: forty shrink a one-frame bracket below a picosecond, past which a
   * film second carries no meaning.
   */
  export const REFINE: number = 40;

  /*
   * The golden section's inner ratio, (sqrt 5 - 1) / 2.
   */
  export const GOLDEN: number = (Math.sqrt(5) - 1) / 2;

  /*
   * A body's admitted footprint: its hull, radius and margin.
   */
  export interface IHull {
    /*
     * The convex hull's points on the floor, counter-clockwise, y 0.
     */
    points: IAutoMovieVector3[];

    /*
     * The footprint's radius, metres.
     */
    radius: number;

    /*
     * The body's margin, metres.
     */
    margin: number;
  }

  /*
   * Two bodies measured together.
   */
  export interface IPair {
    /*
     * The earlier-listed participant's name.
     */
    subject: string;

    /*
     * The later-listed participant's or the obstacle's name.
     */
    other: string;

    /*
     * The margin the pair keeps, metres.
     */
    required: number;

    /*
     * The pair's clearance at any film second.
     * Parameter seconds: The film second.
     * Returns: Metres.
     */
    at(seconds: number): number;

    /*
     * The pair's clearance at a measured instant, from the shared placements.
     * Parameter k: The instant's index.
     * Returns: Metres.
     */
    sampled(k: number): number;
  }

  /*
   * A located minimum of a pair's clearance.
   */
  export interface IMinimum {
    /*
     * The film second.
     */
    seconds: number;

    /*
     * The clearance there, metres.
     */
    clearance: number;
  }

  /*
   * Refuse a window that does not run forward or a step that is not positive.
   */
  export function admitWindow(
    archetype: string,
    from: number,
    to: number,
    step: number,
  ): void {
    if (!(to > from))
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype,
        axis: "to",
        value: to,
        feasible: { kind: "range", minimum: from, maximum: null, unit: "s" },
        reason: `the window from ${from} s to ${to} s does not run forward`,
        fix: "give finite seconds with the last after the first",
      });
    if (!(step > 0))
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype,
        axis: "step",
        value: step,
        feasible: { kind: "range", minimum: 0, maximum: null, unit: "s" },
        reason: `a step of ${step} s does not advance`,
        fix: "give a positive step, such as one film frame",
      });
  }

  /*
   * Admit one body's name, margin and footprint, and hull its outline.
   */
  export function admitBody(
    archetype: string,
    axis: string,
    body: AutoMovieArchetypePassage.IObstacle,
    names: Set<string>,
  ): IHull {
    const refuse: (field: string, value: unknown, reason: string) => never = (
      field: string,
      value: unknown,
      reason: string,
    ): never => {
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype,
        axis: `${axis}.${field}`,
        value,
        reason,
        fix: "give each body a unique name, a finite margin and radius of at least 0 and at least one finite outline point",
      });
    };
    if (body.id.length === 0 || names.has(body.id))
      refuse("id", body.id, `the name "${body.id}" is empty or already taken`);
    names.add(body.id);
    if (!(body.margin >= 0))
      refuse("margin", body.margin, "a margin is finite and at least 0");
    if (!(body.footprint.radius >= 0))
      refuse(
        "footprint.radius",
        body.footprint.radius,
        "a radius is finite and at least 0",
      );
    if (body.footprint.outline.length === 0)
      refuse(
        "footprint.outline",
        body.footprint.outline,
        "an outline has at least one finite point",
      );
    return {
      points: AutoMovieEngineMath.convexHull2D(
        body.footprint.outline.map(
          (point: IAutoMovieVector3): IAutoMovieVector3 => ({
            x: point.x,
            y: 0,
            z: point.z,
          }),
        ),
      ),
      radius: body.footprint.radius,
      margin: body.margin,
    };
  }

  /*
   * A hull carried by a plan's placement at a second, projected onto the floor.
   */
  export function place(
    plan: AutoMovieArchetypeCourse.IPlan,
    points: readonly IAutoMovieVector3[],
    seconds: number,
  ): IAutoMovieVector3[] {
    const state: AutoMovieArchetypeCourse.IState = plan.at(seconds);
    const origin: IAutoMovieVector3 = state.placement.translation;
    return points.map((point: IAutoMovieVector3): IAutoMovieVector3 => {
      const turned: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
        state.placement.rotation,
        point,
      );
      return { x: origin.x + turned.x, y: 0, z: origin.z + turned.z };
    });
  }

  /*
   * The least distance between two convex floor hulls: over every pair of edges,
   * a single point or segment being its own edge, and zero when one holds a
   * vertex of the other.
   */
  export function separation(
    a: readonly IAutoMovieVector3[],
    b: readonly IAutoMovieVector3[],
  ): number {
    let least: number = Infinity;
    for (let i: number = 0; i < sides(a); ++i)
      for (let j: number = 0; j < sides(b); ++j)
        least = Math.min(
          least,
          AutoMovieEngineMath.segmentSegmentDistance(
            a[i]!,
            a[(i + 1) % a.length]!,
            b[j]!,
            b[(j + 1) % b.length]!,
          ),
        );
    return least > 0 && (inside(a[0]!, b) || inside(b[0]!, a)) ? 0 : least;
  }

  /*
   * How many edges a hull has: one for a point or a segment, else one per vertex.
   */
  export function sides(hull: readonly IAutoMovieVector3[]): number {
    return hull.length < 3 ? 1 : hull.length;
  }

  /*
   * Whether a point lies inside a counter-clockwise hull of at least three
   * vertices: on the left of, or on, every edge.
   */
  export function inside(
    point: IAutoMovieVector3,
    hull: readonly IAutoMovieVector3[],
  ): boolean {
    if (hull.length < 3) return false;
    return hull.every((from: IAutoMovieVector3, i: number): boolean => {
      const to: IAutoMovieVector3 = hull[(i + 1) % hull.length]!;
      return (
        (to.x - from.x) * (point.z - from.z) -
          (to.z - from.z) * (point.x - from.x) >=
        0
      );
    });
  }

  /*
   * One pair's conflicts: each run of instants inside the margin, and each
   * sampled minimum whose refinement dips inside it.
   */
  export function scan(
    pair: IPair,
    times: readonly number[],
  ): AutoMovieArchetypePassage.IConflict[] {
    const slack: number[] = times.map(
      (_: number, k: number): number => pair.sampled(k) - pair.required,
    );
    const below: (seconds: number) => boolean = (seconds: number): boolean =>
      pair.at(seconds) - pair.required < 0;
    const found: AutoMovieArchetypePassage.IConflict[] = [];
    const last: number = times.length - 1;
    let k: number = 0;
    while (k <= last) {
      const before: number = times[Math.max(0, k - 1)]!;
      const after: number = times[Math.min(last, k + 1)]!;
      if (slack[k]! < 0) {
        let end: number = k;
        while (end < last && slack[end + 1]! < 0) ++end;
        let deepest: number = k;
        for (let m: number = k + 1; m <= end; ++m)
          if (slack[m]! < slack[deepest]!) deepest = m;
        const enter: number =
          k === 0 ? times[0]! : edge(below, times[k - 1]!, times[k]!);
        const leave: number =
          end === last
            ? times[last]!
            : edge(below, times[end + 1]!, times[end]!);
        const refined: IMinimum = least(
          pair,
          Math.max(enter, times[Math.max(0, deepest - 1)]!),
          Math.min(leave, times[Math.min(last, deepest + 1)]!),
          {
            seconds: times[deepest]!,
            clearance: slack[deepest]! + pair.required,
          },
        );
        found.push(conflict(pair, enter, leave, refined));
        k = end + 1;
        continue;
      }
      // A sampled minimum: below the instant before it and not above the one
      // after, so a level run is refined once, at its first instant.
      const minimum: boolean =
        (k === 0 || slack[k]! < slack[k - 1]!) &&
        (k === last || slack[k]! <= slack[k + 1]!) &&
        before < after;
      if (!minimum) {
        ++k;
        continue;
      }
      const refined: IMinimum = least(pair, before, after, {
        seconds: times[k]!,
        clearance: slack[k]! + pair.required,
      });
      if (!(refined.clearance < pair.required)) {
        ++k;
        continue;
      }
      const dip: AutoMovieArchetypePassage.IConflict = conflict(
        pair,
        edge(below, before, refined.seconds),
        edge(below, after, refined.seconds),
        refined,
      );
      found.push(dip);
      while (k <= last && times[k]! <= dip.to) ++k;
    }
    return found;
  }

  /*
   * The refused end of a bracket between an admitted second and a refused one, by
   * bisection.
   */
  export function edge(
    below: (seconds: number) => boolean,
    admitted: number,
    refused: number,
  ): number {
    let outside: number = admitted;
    let within: number = refused;
    for (let step: number = 0; step < REFINE; ++step) {
      const middle: number = (outside + within) / 2;
      if (below(middle)) within = middle;
      else outside = middle;
    }
    return within;
  }

  /*
   * The least clearance in a bracket by golden-section search, or the sampled one
   * when no inner reading is lower.
   */
  export function least(
    pair: IPair,
    low: number,
    high: number,
    sampled: IMinimum,
  ): IMinimum {
    let a: number = low;
    let b: number = high;
    let c: number = b - GOLDEN * (b - a);
    let d: number = a + GOLDEN * (b - a);
    let fc: number = pair.at(c);
    let fd: number = pair.at(d);
    for (let step: number = 0; step < REFINE; ++step)
      if (fc < fd) {
        b = d;
        d = c;
        fd = fc;
        c = b - GOLDEN * (b - a);
        fc = pair.at(c);
      } else {
        a = c;
        c = d;
        fc = fd;
        d = a + GOLDEN * (b - a);
        fd = pair.at(d);
      }
    const best: IMinimum =
      fc < fd ? { seconds: c, clearance: fc } : { seconds: d, clearance: fd };
    return best.clearance < sampled.clearance ? best : sampled;
  }

  /*
   * A conflict record of a pair over an interval.
   */
  export function conflict(
    pair: IPair,
    from: number,
    to: number,
    closest: IMinimum,
  ): AutoMovieArchetypePassage.IConflict {
    return {
      subject: pair.subject,
      other: pair.other,
      from,
      to,
      seconds: closest.seconds,
      clearance: closest.clearance,
      required: pair.required,
    };
  }

  /*
   * A counter-clockwise hull grown outward by a distance with mitred corners,
   * which holds every point within that distance of the hull; a point or a
   * segment grows into a square or a rectangle about it.
   */
  export function mitre(
    hull: readonly IAutoMovieVector3[],
    distance: number,
  ): IAutoMovieVector3[] {
    if (distance === 0) return [...hull];
    if (hull.length < 3) {
      const a: IAutoMovieVector3 = hull[0]!;
      const b: IAutoMovieVector3 = hull[hull.length - 1]!;
      const length: number = Math.hypot(b.x - a.x, b.z - a.z);
      const ux: number = length > 0 ? (b.x - a.x) / length : 1;
      const uz: number = length > 0 ? (b.z - a.z) / length : 0;
      const corner: (
        from: IAutoMovieVector3,
        along: number,
        across: number,
      ) => IAutoMovieVector3 = (
        from: IAutoMovieVector3,
        along: number,
        across: number,
      ): IAutoMovieVector3 => ({
        x: from.x + distance * (along * ux - across * uz),
        y: 0,
        z: from.z + distance * (along * uz + across * ux),
      });
      return [
        corner(a, -1, -1),
        corner(b, 1, -1),
        corner(b, 1, 1),
        corner(a, -1, 1),
      ];
    }
    // Each edge's outward normal is its direction turned clockwise, the side away from a counter-clockwise interior.
    const normal: (k: number) => IAutoMovieVector3 = (
      k: number,
    ): IAutoMovieVector3 => {
      const from: IAutoMovieVector3 = hull[k]!;
      const to: IAutoMovieVector3 = hull[(k + 1) % hull.length]!;
      const length: number = Math.hypot(to.x - from.x, to.z - from.z);
      return {
        x: (to.z - from.z) / length,
        y: 0,
        z: -(to.x - from.x) / length,
      };
    };
    return hull.map(
      (vertex: IAutoMovieVector3, k: number): IAutoMovieVector3 => {
        const a: IAutoMovieVector3 = normal(
          (k + hull.length - 1) % hull.length,
        );
        const b: IAutoMovieVector3 = normal(k);
        const scale: number = distance / (1 + a.x * b.x + a.z * b.z);
        return {
          x: vertex.x + (a.x + b.x) * scale,
          y: 0,
          z: vertex.z + (a.z + b.z) * scale,
        };
      },
    );
  }
}

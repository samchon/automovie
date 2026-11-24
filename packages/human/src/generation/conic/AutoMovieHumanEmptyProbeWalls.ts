import {
  AutoMovieLoftChain,
  AutoMovieViewChain,
  bracketedRoot,
} from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanConicSection,
  IAutoMovieLoftChain,
  IAutoMovieLoftSectionFrame,
  IAutoMovieSolidSurface,
  IAutoMovieViewAxis,
} from "@automovie/interface";

import { AutoMovieHumanConicLoft } from "./AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "./AutoMovieHumanConicSection";

/**
 * The wall geometry `AutoMovieHumanEmptyProbes` places its gap probes by: a
 * family's course, the walls two families face each other with, and the ring
 * phase spacing a gap must exceed.
 *
 * Walls are read on the families' original sections
 * (`AutoMovieHumanConicSection.chain` at the station, read along a ray by
 * `AutoMovieViewChain.radius`), never on a realized skin. Every point is
 * millimetres in the families' frame (forward +X, up +Y, left +Z). Prepare a
 * family's fields, course and phase count for the probe search that uses them.
 */
export namespace AutoMovieHumanEmptyProbeWalls {
  /** The facing walls of two sides at one station of the first. */
  export interface IGap {
    /**
     * The signed distance from the first side's wall to the second's along the
     * line between their course points, mm; negative where they cross.
     */
    gap: number;

    /**
     * Twice the larger ring phase spacing of the two sides at their stations,
     * mm.
     */
    required: number;

    /** The midpoint between the two wall points, mm. */
    middle: AutoMovieVector3Tuple;

    /** The second side's station, mm. */
    other: number;
  }

  /** Read one family's original section geometry throughout a probe search. */
  export interface IReader {
    /** Station of the course closest to the given world point. */
    nearest: (point: AutoMovieVector3Tuple) => number;

    /**
     * Read the original wall and spacing of the section at the given station in
     * mm.
     */
    section: (station: number) => ISection;
  }

  /** A section prepared once for both the wall point and its phase spacing. */
  interface ISection {
    /** Course point in mm. */
    origin: AutoMovieVector3Tuple;

    /** Phase spacing in mm. */
    spacing: number;

    /** Point on the wall along the ray toward the given world point. */
    wall: (target: AutoMovieVector3Tuple) => AutoMovieVector3Tuple;
  }

  /**
   * Prepare the actual published loft's course and periodic section reader. The
   * original phase grid brackets the wall on the projected ray and gives the
   * longest physical ring chord used by the probe's spacing rule.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Intersects the retained Point0 curve with the facing ray in its own section frame. The root and phase spacing use the retained ring domain and angular correspondence.
   * @evidence contracts/development/implementation.md#efficient-algorithms Prepares one millimetre course search grid per supplied chain. Each requested section prepares one fixed-station point reader, evaluates its ring once, and refines only sign-changing intervals.
   */
  export function retained(
    chain: IAutoMovieLoftChain,
    surface: IAutoMovieSolidSurface,
  ): IReader {
    const period = surface.period;
    const first = chain.layers[0]?.y;
    const last = chain.layers.at(-1)?.y;
    if (
      surface.name !== chain.name ||
      period === undefined ||
      !(period > 0) ||
      first === undefined ||
      last === undefined ||
      !(last > first) ||
      chain.samples < 3
    )
      throw new Error(`${chain.name} has no matching periodic loft course`);
    const phases: number[] =
      chain.phases ??
      Array.from(
        { length: chain.samples },
        (_, index): number => (period * index) / chain.samples,
      );
    const course = (station: number): AutoMovieVector3Tuple =>
      AutoMovieLoftChain.frame(chain, station).origin;
    const grid: ICourseSample[] = [];
    for (let station = first; station < last; ++station)
      grid.push({ station, point: course(station) });
    grid.push({ station: last, point: course(last) });
    return {
      nearest: (point): number => nearest(course, grid, point),
      section: (station): ISection => {
        const frame = AutoMovieLoftChain.frame(chain, station);
        const at =
          surface.pointAt?.(station) ??
          ((phase: number): AutoMovieVector3Tuple =>
            surface.point?.(station, phase) ?? surface.jet(station, phase).p);
        const points = phases.map(at);
        const spacing = Math.max(
          ...points.map((point, index): number =>
            Math.hypot(...sub(point, points[(index + 1) % points.length]!)),
          ),
        );
        return {
          origin: frame.origin,
          spacing,
          wall: (target): AutoMovieVector3Tuple =>
            retainedWall(chain.name, frame, at, phases, points, period, target),
        };
      },
    };
  }

  /** Locate a single forward wall on the retained section's projected ray. */
  function retainedWall(
    name: string,
    frame: IAutoMovieLoftSectionFrame,
    at: (phase: number) => AutoMovieVector3Tuple,
    phases: readonly number[],
    points: readonly AutoMovieVector3Tuple[],
    period: number,
    target: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    const toward = sub(target, frame.origin);
    const u = dot(toward, frame.u);
    const v = dot(toward, frame.v);
    const cross = (p: AutoMovieVector3Tuple): number => {
      const local = sub(p, frame.origin);
      return u * dot(local, frame.v) - v * dot(local, frame.u);
    };
    const signs = points.map(cross);
    const matches: AutoMovieVector3Tuple[] = [];
    for (const [index, left] of phases.entries()) {
      const next = (index + 1) % phases.length;
      const right = phases[next]! + (next === 0 ? period : 0);
      const a = signs[index]!;
      const b = signs[next]!;
      const point =
        a === 0
          ? points[index]!
          : a * b < 0
            ? at(
                bracketedRoot(
                  (phase): number => cross(at(phase)),
                  left,
                  right,
                  Number.EPSILON * period,
                ),
              )
            : undefined;
      if (point === undefined) continue;
      const local = sub(point, frame.origin);
      if (u * dot(local, frame.u) + v * dot(local, frame.v) > 0)
        matches.push(point);
    }
    if (matches.length !== 1)
      throw new Error(
        `${name} has ${matches.length} forward walls on its facing ray`,
      );
    return matches[0]!;
  }

  /**
   * The walls of `a` at `station` and of `b` at the station where its course
   * comes nearest `a`'s course point there, each read along the ray from its
   * course point toward the other's.
   *
   * @param a The side whose station is given.
   * @param b The other side.
   * @returns Read the gap, required gap, midpoint and `b`'s station at an input
   *   station along `a`'s course in mm.
   */
  export function facing(a: IReader, b: IReader): (station: number) => IGap {
    return (station: number): IGap => {
      const from: ISection = a.section(station);
      const other: number = b.nearest(from.origin);
      const to: ISection = b.section(other);
      const near: AutoMovieVector3Tuple = from.wall(to.origin);
      const far: AutoMovieVector3Tuple = to.wall(from.origin);
      const line: number[] = sub(to.origin, from.origin);
      return {
        gap: dot(sub(far, near), line) / Math.hypot(...line),
        required: 2 * Math.max(from.spacing, to.spacing),
        middle: [0, 1, 2].map(
          (c: number): number => (near[c]! + far[c]!) / 2,
        ) as AutoMovieVector3Tuple,
        other,
      };
    };
  }

  /**
   * Prepare the course, field splines, nearest-course search grid and uniform
   * phase count shared by the probe searches of one family.
   *
   * @param family The family.
   * @returns Its course and wall readers in figure-world mm.
   */
  export function prepare(family: IAutoMovieHumanConicLoft.IFamily): IReader {
    const axis: IAutoMovieViewAxis.IAxis = AutoMovieHumanConicLoft.axis(family);
    const read: (station: number) => number[] =
      AutoMovieHumanConicLoft.reader(family);
    const resolve: (
      values: readonly number[],
    ) => IAutoMovieHumanConicSection.IChain =
      AutoMovieHumanConicSection.prepare(family.layout);
    const course = (station: number): AutoMovieVector3Tuple => [
      ...axis.at(station).origin,
    ];
    const sectionAt = (station: number): IAutoMovieHumanConicSection.IChain =>
      resolve(read(station));
    const first: number = family.knots[0]!;
    const last: number = family.knots.at(-1)!;
    const grid: ICourseSample[] = [];
    let widest: number = 0;
    for (let station: number = first; station < last; station += 1) {
      grid.push({ station, point: course(station) });
      widest = Math.max(widest, girth(sectionAt(station)));
    }
    grid.push({ station: last, point: course(last) });
    const count: number = AutoMovieHumanConicLoft.phaseCount(
      family,
      Math.max(widest, girth(sectionAt(last))),
    );
    return {
      nearest: (point: AutoMovieVector3Tuple): number =>
        nearest(course, grid, point),
      section: (station: number): ISection => {
        const frame: IAutoMovieLoftSectionFrame = axis.at(station);
        const chain: IAutoMovieHumanConicSection.IChain = sectionAt(station);
        return {
          origin: frame.origin,
          spacing: girth(chain) / count,
          wall: (target: AutoMovieVector3Tuple): AutoMovieVector3Tuple =>
            wall(family.name, frame, chain, station, target),
        };
      },
    };
  }

  /**
   * A twin's readings reflect both the queries and the results across the
   * median plane.
   */
  export function reflect(original: IReader): IReader {
    const across = ([
      x,
      y,
      z,
    ]: AutoMovieVector3Tuple): AutoMovieVector3Tuple => [x, y, -z];
    return {
      nearest: (point: AutoMovieVector3Tuple): number =>
        original.nearest(across(point)),
      section: (station: number): ISection => {
        const section: ISection = original.section(station);
        return {
          origin: across(section.origin),
          spacing: section.spacing,
          wall: (target: AutoMovieVector3Tuple): AutoMovieVector3Tuple =>
            across(section.wall(across(target))),
        };
      },
    };
  }

  /** A wall point toward the target, projected into the section's plane. */
  function wall(
    name: string,
    frame: IAutoMovieLoftSectionFrame,
    chain: IAutoMovieHumanConicSection.IChain,
    station: number,
    target: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    const toward: number[] = sub(target, frame.origin);
    const phi: number = Math.atan2(dot(toward, frame.v), dot(toward, frame.u));
    const radius: number = AutoMovieViewChain.radius(
      AutoMovieViewChain.of(chain.input),
      phi,
    );
    if (!Number.isFinite(radius))
      throw new Error(
        `empty probes: ${name}'s section at ${station} mm has no wall at phase ${phi}`,
      );
    return [0, 1, 2].map(
      (c: number): number =>
        frame.origin[c]! +
        radius * (Math.cos(phi) * frame.u[c]! + Math.sin(phi) * frame.v[c]!),
    ) as AutoMovieVector3Tuple;
  }

  /**
   * Ramanujan's perimeter of the ellipse on a section's half extents, mm, as
   * the loft reads a girth.
   */
  function girth(chain: IAutoMovieHumanConicSection.IChain): number {
    const [a, b]: number[] = [0, 1].map((c: number): number => {
      const values: number[] = chain.input.points.map(
        (p: readonly number[]): number => p[c]!,
      );
      return (Math.max(...values) - Math.min(...values)) / 2;
    });
    return Math.PI * (3 * (a! + b!) - Math.sqrt((3 * a! + b!) * (a! + 3 * b!)));
  }

  /** A millimetre-grid course point together with its physical station. */
  interface ICourseSample {
    station: number;
    point: AutoMovieVector3Tuple;
  }

  /**
   * The station of a side's course nearest a point: the best station of a
   * millimetre grid over the fields' domain, then the root of the distance's
   * derivative, `(C(s) - p) . C'(s)`, by regula falsi on the grid steps either
   * side, which is exact on a straight course.
   */
  function nearest(
    course: (station: number) => AutoMovieVector3Tuple,
    grid: readonly ICourseSample[],
    point: AutoMovieVector3Tuple,
  ): number {
    const [first, last]: [number, number] = [
      grid[0]!.station,
      grid.at(-1)!.station,
    ];
    let best: number = first;
    let minimum: number = Math.hypot(...sub(grid[0]!.point, point));
    for (const sample of grid) {
      const distance: number = Math.hypot(...sub(sample.point, point));
      if (distance < minimum) {
        minimum = distance;
        best = sample.station;
      }
    }
    const slope: (s: number) => number = (s: number): number => {
      const h: number = 1e-3;
      const [lo, hi]: [number, number] = [
        Math.max(first, s - h),
        Math.min(last, s + h),
      ];
      return dot(sub(course(s), point), sub(course(hi), course(lo)));
    };
    let [lo, hi]: [number, number] = [
      Math.max(first, best - 1),
      Math.min(last, best + 1),
    ];
    let [flo, fhi]: [number, number] = [slope(lo), slope(hi)];
    if (!(flo <= 0 && fhi >= 0)) return best;
    for (let k: number = 0; k < 100 && hi - lo > 1e-12; ++k) {
      const s: number =
        fhi === flo ? (lo + hi) / 2 : lo - (flo * (hi - lo)) / (fhi - flo);
      const f: number = slope(s);
      if (f === 0) return s;
      if (f < 0) [lo, flo] = [s, f];
      else [hi, fhi] = [s, f];
      if (Math.abs(f) < 1e-15) return s;
    }
    return Math.abs(flo) <= Math.abs(fhi) ? lo : hi;
  }

  /** The difference of two points. */
  function sub(a: readonly number[], b: readonly number[]): number[] {
    return [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
  }

  /** The dot product of two vectors. */
  function dot(a: readonly number[], b: readonly number[]): number {
    return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
  }
}

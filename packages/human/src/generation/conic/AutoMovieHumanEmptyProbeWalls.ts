import { AutoMovieViewChain } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanConicSection,
  IAutoMovieLoftSectionFrame,
  IAutoMovieViewAxis,
  IAutoMovieViewChain,
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
 * millimetres in the families' frame (forward +X, up +Y, left +Z). A probe
 * listing prepares each wall it reads from the family's declarations.
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

  /** Geometry prepared from one family declaration for its gap probes. */
  export interface IWall {
    /** The declaration supplying the station domain and probe names. */
    readonly family: IAutoMovieHumanConicLoft.IFamily;

    /** The course and its section frames, prepared from the same declaration. */
    readonly axis: IAutoMovieViewAxis.IAxis;

    /** The original conic section at a station in millimetres. */
    readonly section: (station: number) => IAutoMovieViewChain.ISection;

    /** An upper bound on the mean ring phase step at a station, mm. */
    readonly spacing: (station: number) => number;
  }

  /** A prepared wall in its stored frame or reflected in the median plane. */
  export interface ISide {
    /** The prepared wall in the stored family's frame. */
    readonly wall: IWall;

    /** Whether to reflect the course and wall across the median plane. */
    readonly reflected: boolean;
  }

  /**
   * Prepare the course, natural-spline fields and uniform phase count for the
   * current probe declaration. The count follows the loft's rule on the widest
   * section, read every millimetre over the family's domain. A family that
   * spaces its phases by turn takes at least as many phases.
   */
  export function prepare(family: IAutoMovieHumanConicLoft.IFamily): IWall {
    const axis: IAutoMovieViewAxis.IAxis = AutoMovieHumanConicLoft.axis(family);
    const read: (station: number) => number[] =
      AutoMovieHumanConicLoft.reader(family);
    const resolve = AutoMovieHumanConicSection.prepare(family.layout);
    const girthAt = (station: number): number => girth(resolve(read(station)));
    const [first, last]: [number, number] = [
      family.knots[0]!,
      family.knots.at(-1)!,
    ];
    let widest: number = girthAt(last);
    for (let s: number = first; s < last; s += 1)
      widest = Math.max(widest, girthAt(s));
    const count: number = AutoMovieHumanConicLoft.phaseCount(family, widest);
    return {
      family,
      axis,
      section: (station: number): IAutoMovieViewChain.ISection =>
        AutoMovieViewChain.of(resolve(read(station)).input),
      spacing: (station: number): number => girthAt(station) / count,
    };
  }

  /**
   * The walls of `a` at `station` and of `b` at the station where its course
   * comes nearest `a`'s course point there, each read along the ray from its
   * course point toward the other's.
   *
   * @param a The side whose station is given.
   * @param station The station of `a`'s course, mm.
   * @param b The other side.
   * @returns The gap between the facing walls, the gap required, their midpoint
   *   and `b`'s station.
   */
  export function facing(a: ISide, station: number, b: ISide): IGap {
    const from: AutoMovieVector3Tuple = course(a, station);
    const other: number = nearest(b, from);
    const to: AutoMovieVector3Tuple = course(b, other);
    const near: AutoMovieVector3Tuple = wall(a, station, to);
    const far: AutoMovieVector3Tuple = wall(b, other, from);
    const line: number[] = sub(to, from);
    const length: number = Math.hypot(...line);
    return {
      gap: dot(sub(far, near), line) / length,
      required: 2 * Math.max(a.wall.spacing(station), b.wall.spacing(other)),
      middle: [0, 1, 2].map(
        (c: number): number => (near[c]! + far[c]!) / 2,
      ) as AutoMovieVector3Tuple,
      other,
    };
  }

  /** A side's course point at a station. */
  function course(side: ISide, station: number): AutoMovieVector3Tuple {
    const origin: readonly number[] = side.wall.axis.at(station).origin;
    return side.reflected
      ? [origin[0]!, origin[1]!, -origin[2]!]
      : [origin[0]!, origin[1]!, origin[2]!];
  }

  /**
   * A side's wall point at a station on the ray from its course point toward
   * `target`, projected into the section's plane. A twin's wall is the stored
   * family's wall toward the reflected target, reflected.
   */
  function wall(
    side: ISide,
    station: number,
    target: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    if (side.reflected) {
      const point: AutoMovieVector3Tuple = wall(
        { wall: side.wall, reflected: false },
        station,
        [target[0], target[1], -target[2]],
      );
      return [point[0], point[1], -point[2]];
    }
    const frame: IAutoMovieLoftSectionFrame = side.wall.axis.at(station);
    const toward: number[] = sub(target, frame.origin);
    const phi: number = Math.atan2(dot(toward, frame.v), dot(toward, frame.u));
    const radius: number = AutoMovieViewChain.radius(
      side.wall.section(station),
      phi,
    );
    if (!Number.isFinite(radius))
      throw new Error(
        `empty probes: ${side.wall.family.name}'s section at ${station} mm has no wall at phase ${phi}`,
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
  function girth(
    chain: IAutoMovieHumanConicSection.IChain,
  ): number {
    const [a, b]: number[] = [0, 1].map((c: number): number => {
      const values: number[] = chain.input.points.map(
        (p: readonly number[]): number => p[c]!,
      );
      return (Math.max(...values) - Math.min(...values)) / 2;
    });
    return Math.PI * (3 * (a! + b!) - Math.sqrt((3 * a! + b!) * (a! + 3 * b!)));
  }

  /**
   * The station of a side's course nearest a point: the best station of a
   * millimetre grid over the fields' domain, then the root of the distance's
   * derivative, `(C(s) - p) . C'(s)`, by regula falsi on the grid steps either
   * side, which is exact on a straight course.
   */
  function nearest(side: ISide, point: AutoMovieVector3Tuple): number {
    const [first, last]: [number, number] = [
      side.wall.family.knots[0]!,
      side.wall.family.knots.at(-1)!,
    ];
    const distance: (s: number) => number = (s: number): number =>
      Math.hypot(...sub(course(side, s), point));
    let best: number = first;
    for (let s: number = first; s <= last; s += 1)
      if (distance(s) < distance(best)) best = s;
    if (distance(last) < distance(best)) best = last;
    const slope: (s: number) => number = (s: number): number => {
      const h: number = 1e-3;
      const [lo, hi]: [number, number] = [
        Math.max(first, s - h),
        Math.min(last, s + h),
      ];
      return dot(
        sub(course(side, s), point),
        sub(course(side, hi), course(side, lo)),
      );
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

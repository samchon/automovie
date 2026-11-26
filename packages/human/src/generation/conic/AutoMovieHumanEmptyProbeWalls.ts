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
import type { AutoMovieHumanEmptyProbes } from "./AutoMovieHumanEmptyProbes";

/**
 * The wall geometry `AutoMovieHumanEmptyProbes` places its gap probes by: a
 * family's course, the walls two families face each other with, and the ring
 * phase spacing a gap must exceed.
 *
 * Walls are read on the families' original sections
 * (`AutoMovieHumanConicSection.chain` at the station, read along a ray by
 * `AutoMovieViewChain.radius`), never on a realized skin. Every point is
 * millimetres in the families' frame (forward +X, up +Y, left +Z). Each
 * family's course, field reader and phase count is built once and cached by the
 * family.
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
  export function facing(
    a: AutoMovieHumanEmptyProbes.ISide,
    station: number,
    b: AutoMovieHumanEmptyProbes.ISide,
  ): IGap {
    const from: AutoMovieVector3Tuple = course(a, station);
    const other: number = nearest(b, from);
    const to: AutoMovieVector3Tuple = course(b, other);
    const near: AutoMovieVector3Tuple = wall(a, station, to);
    const far: AutoMovieVector3Tuple = wall(b, other, from);
    const line: number[] = sub(to, from);
    const length: number = Math.hypot(...line);
    return {
      gap: dot(sub(far, near), line) / length,
      required:
        2 * Math.max(spacing(a.family, station), spacing(b.family, other)),
      middle: [0, 1, 2].map(
        (c: number): number => (near[c]! + far[c]!) / 2,
      ) as AutoMovieVector3Tuple,
      other,
    };
  }

  /**
   * A family's course, built once: `AutoMovieHumanConicLoft.axis` builds a new
   * jointed course on every call.
   *
   * @param family The family.
   * @returns Its course, shared by later calls with the same family.
   */
  export function axisOf(
    family: IAutoMovieHumanConicLoft.IFamily,
  ): IAutoMovieViewAxis.IAxis {
    let axis: IAutoMovieViewAxis.IAxis | undefined = AXES.get(family);
    if (axis === undefined)
      AXES.set(family, (axis = AutoMovieHumanConicLoft.axis(family)));
    return axis;
  }

  /** A side's course point at a station. */
  function course(
    side: AutoMovieHumanEmptyProbes.ISide,
    station: number,
  ): AutoMovieVector3Tuple {
    const origin: readonly number[] = axisOf(side.family).at(station).origin;
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
    side: AutoMovieHumanEmptyProbes.ISide,
    station: number,
    target: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    if (side.reflected) {
      const point: AutoMovieVector3Tuple = wall(
        { family: side.family, reflected: false },
        station,
        [target[0], target[1], -target[2]],
      );
      return [point[0], point[1], -point[2]];
    }
    const frame: IAutoMovieLoftSectionFrame = axisOf(side.family).at(station);
    const toward: number[] = sub(target, frame.origin);
    const phi: number = Math.atan2(dot(toward, frame.v), dot(toward, frame.u));
    const radius: number = AutoMovieViewChain.radius(
      section(side.family, station),
      phi,
    );
    if (!Number.isFinite(radius))
      throw new Error(
        `empty probes: ${side.family.name}'s section at ${station} mm has no wall at phase ${phi}`,
      );
    return [0, 1, 2].map(
      (c: number): number =>
        frame.origin[c]! +
        radius * (Math.cos(phi) * frame.u[c]! + Math.sin(phi) * frame.v[c]!),
    ) as AutoMovieVector3Tuple;
  }

  /** A family's original section at a station, as the engine's conic chain. */
  function section(
    family: IAutoMovieHumanConicLoft.IFamily,
    station: number,
  ): IAutoMovieViewChain.ISection {
    return AutoMovieHumanConicSection.chain(
      readerOf(family)(station),
      family.layout,
    );
  }

  /**
   * The ring phase spacing of a family at a station, mm: the section's girth
   * there over the family's phase count. The girth is Ramanujan's perimeter of
   * the ellipse on the section's half extents, and the count is
   * `AutoMovieHumanConicLoft.phaseCount` on the widest such girth over the
   * fields' domain read every millimetre, as the loft sets its uniform phases.
   * A family that spaces its phases by turn takes at least as many, so this
   * spacing bounds its mean phase step from above.
   */
  function spacing(
    family: IAutoMovieHumanConicLoft.IFamily,
    station: number,
  ): number {
    let count: number | undefined = COUNTS.get(family);
    if (count === undefined) {
      const [first, last]: [number, number] = [
        family.knots[0]!,
        family.knots.at(-1)!,
      ];
      let widest: number = girth(family, last);
      for (let s: number = first; s < last; s += 1)
        widest = Math.max(widest, girth(family, s));
      count = AutoMovieHumanConicLoft.phaseCount(family, widest);
      COUNTS.set(family, count);
    }
    return girth(family, station) / count;
  }

  /** Each family's course, built once. */
  const AXES: WeakMap<
    IAutoMovieHumanConicLoft.IFamily,
    IAutoMovieViewAxis.IAxis
  > = new WeakMap();

  /**
   * Each family's field reader, built once: `AutoMovieHumanConicLoft.reader`
   * fits its natural cubics on every call.
   */
  const READERS: WeakMap<
    IAutoMovieHumanConicLoft.IFamily,
    (s: number) => number[]
  > = new WeakMap();

  /** Each family's uniform phase count, read once. */
  const COUNTS: WeakMap<IAutoMovieHumanConicLoft.IFamily, number> =
    new WeakMap();

  /** A family's field reader, cached. */
  function readerOf(
    family: IAutoMovieHumanConicLoft.IFamily,
  ): (s: number) => number[] {
    let read: ((s: number) => number[]) | undefined = READERS.get(family);
    if (read === undefined)
      READERS.set(family, (read = AutoMovieHumanConicLoft.reader(family)));
    return read;
  }

  /**
   * Ramanujan's perimeter of the ellipse on a section's half extents, mm, as
   * the loft reads a girth.
   */
  function girth(
    family: IAutoMovieHumanConicLoft.IFamily,
    station: number,
  ): number {
    const chain: IAutoMovieHumanConicSection.IChain =
      AutoMovieHumanConicSection.resolve(
        readerOf(family)(station),
        family.layout,
      );
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
  function nearest(
    side: AutoMovieHumanEmptyProbes.ISide,
    point: AutoMovieVector3Tuple,
  ): number {
    const [first, last]: [number, number] = [
      side.family.knots[0]!,
      side.family.knots.at(-1)!,
    ];
    function distance(s: number): number {
      return Math.hypot(...sub(course(side, s), point));
    }
    let best: number = first;
    for (let s: number = first; s <= last; s += 1)
      if (distance(s) < distance(best)) best = s;
    if (distance(last) < distance(best)) best = last;
    function slope(s: number): number {
      const h: number = 1e-3;
      const [lo, hi]: [number, number] = [
        Math.max(first, s - h),
        Math.min(last, s + h),
      ];
      return dot(
        sub(course(side, s), point),
        sub(course(side, hi), course(side, lo)),
      );
    }
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

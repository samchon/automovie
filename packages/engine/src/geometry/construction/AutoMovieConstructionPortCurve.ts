import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionPortCurve,
  IAutoMovieConstructionPortField,
  IAutoMovieConstructionPortLoop,
  IAutoMovieConstructionSplitBand,
} from "@automovie/interface";

import { AutoMovieConstructionPortAddress } from "./AutoMovieConstructionPortAddress";
import { AutoMovieConstructionPortField as Field } from "./AutoMovieConstructionPortField";
import { AutoMovieSolidCycle } from "./AutoMovieSolidCycle";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";

/** Physical point/vector, mm. */
type Vec3 = AutoMovieVector3Tuple;
/** Existing rail-side definition; no new source or surface ownership. */
type ISide = IAutoMovieConstructionSplitBand.ISide;
const { add, cross, dot, norm, scale, sub, unit } = AutoMovieSolidVector;

/** The existing radial port chart and angle/length clock correspondence. */
export namespace AutoMovieConstructionPortCurve {
  /**
   * The admitted loop's existing column addresses and unscaled inward chart
   * directions.
   */
  export function chart(
    loop: IAutoMovieConstructionPortLoop,
    count: number,
  ): { addresses: [number, number][]; inward: [number, number][] } {
    const turn: number = 2 * Math.PI;
    const clock: (k: number) => number = (k: number): number =>
      (turn * k) / count;
    const [a, b]: [number, number] = [loop.semi[0] * 1000, loop.semi[1]];
    const addresses: [number, number][] = Array.from(
      { length: count },
      (_: unknown, k: number): [number, number] => {
        const share: number = loop.shape?.[k] ?? 1;
        return AutoMovieConstructionPortAddress(loop, clock(k), share);
      },
    );
    const inward: [number, number][] = Array.from(
      { length: count },
      (_: unknown, k: number): [number, number] => [
        -a * Math.cos(clock(k)),
        -loop.sense * b * Math.sin(clock(k)),
      ],
    );
    return { addresses, inward };
  }

  /**
   * The port curve between its columns as well as at them: in the normalized
   * chart `X = (u - y0) / a`, `Y = (v - p0) / (sense b)` it is the polar curve
   * `r(c) (cos c, sin c)`, `r` the periodic cubic through the loop's shares
   * (`AutoMovieConstructionPortField.periodic`), or 1 for the plain ellipse.
   * Its clock at a chart point is that point's polar angle, so the foot of a
   * point on the curve is the point itself, and inside is `hypot(X, Y) <
   * r(atan2(Y, X))`.
   *
   * @param loop The admitted loop.
   * @param count The columns.
   * @param period The host's phase period, under which a chart phase is read on
   *   the branch nearest the centre; absent, as given.
   * @returns The curve, or the refusal when a share between columns is not
   *   positive.
   */
  export function curve(
    loop: IAutoMovieConstructionPortLoop,
    count: number,
    period: number | undefined,
  ): IAutoMovieConstructionPortCurve.ICurve | string {
    const columns: {
      addresses: [number, number][];
      inward: [number, number][];
    } = chart(loop, count);
    const share: IAutoMovieConstructionPortField.IField =
      loop.shape === undefined ? Field.constant(1) : Field.periodic(loop.shape);
    if (!(share.bounds[0] > 0))
      return "the port curve's share between columns is not positive everywhere";
    const y0: number = loop.centre[0] * 1000;
    const p0: number = loop.centre[1];
    const a: number = loop.semi[0] * 1000;
    const b: number = loop.semi[1];
    const s: number = loop.sense;
    const turn: number = 2 * Math.PI;

    /**
     * The normalized chart point of a chart point, its phase on the branch
     * nearest the centre.
     */
    const normal = (u: number, v: number): [number, number] => [
      (u - y0) / a,
      (AutoMovieSolidCycle.shift(v, p0, period) - p0) / (s * b),
    ];
    return {
      ...columns,
      reach: [y0 - share.bounds[1] * a, y0 + share.bounds[1] * a],
      semi: a,
      share,
      at: (
        psi: number,
      ): {
        point: [number, number];
        first: [number, number];
        second: [number, number];
      } => {
        const [r, r1, r2]: [number, number, number] = share.at(psi);
        const cos: number = Math.cos(psi);
        const sin: number = Math.sin(psi);
        return {
          point: [y0 + r * a * cos, p0 + r * s * b * sin],
          first: [a * (r1 * cos - r * sin), s * b * (r1 * sin + r * cos)],
          second: [
            a * (r2 * cos - 2 * r1 * sin - r * cos),
            s * b * (r2 * sin + 2 * r1 * cos - r * sin),
          ],
        };
      },
      direction: (
        psi: number,
      ): {
        d: [number, number];
        first: [number, number];
        second: [number, number];
      } => {
        const cos: number = Math.cos(psi);
        const sin: number = Math.sin(psi);
        return {
          d: [-a * cos, -s * b * sin],
          first: [a * sin, -s * b * cos],
          second: [a * cos, s * b * sin],
        };
      },
      clock: (u: number, v: number): number => {
        const [X, Y]: [number, number] = normal(u, v);
        const psi: number = Math.atan2(Y, X);
        return psi < 0 ? psi + turn : psi;
      },
      inside: (u: number, v: number): boolean => {
        const [X, Y]: [number, number] = normal(u, v);
        const rho: number = Math.hypot(X, Y);
        return rho === 0 || rho < share.at(Math.atan2(Y, X))[0];
      },
    };
  }

  /**
   * The actual operator's child phases, preserving its samples, searches and
   * refusal reasons.
   */
  export function correspondence(
    child: ISide,
    loop: readonly Vec3[],
    kind: "angle" | "length",
    guidedRail?: IAutoMovieConstructionSplitBand.IGuidedRail,
  ): number[] | string {
    return kind === "length" || guidedRail !== undefined ? lengths(child, loop, guidedRail) : phases(child, loop);
  }

  /** The same caller-owned rail callback, without clamping or a new source. */
  function railAt(side: ISide, psi: number): number {
    return side.along === undefined ? side.station : side.along(psi);
  }
  /**
   * The child's rail phase at each loop point by arclength, for a split's child
   * and a port's alike: the ring is the child's rail read at its station at
   * each phase (`railAt`, a port's rail curve when it has one), and every
   * column takes the phase that stands as far round the ring, as a share of the
   * ring's length, as the column stands round the loop, the two run the same
   * way when their Newell normals agree, from the start on the ring at which
   * the two curves, each about its own centroid, stand closest in the
   * least-squares sense. Neither curve need be star-shaped about the centroid.
   */
  function lengths(child: ISide, loop: readonly Vec3[], guidedRail?: IAutoMovieConstructionSplitBand.IGuidedRail): number[] | string {
    const turn: number = 2 * Math.PI;
    const samples: number = 8 * loop.length;
    const at: (psi: number) => Vec3 = (psi: number): Vec3 => {
      const p: readonly number[] =
        child.surface.point?.(railAt(child, psi), psi) ??
        child.surface.jet(railAt(child, psi), psi).p;
      return [p[0]!, p[1]!, p[2]!];
    };
    if (guidedRail !== undefined && guidedRail.points.length !== samples)
      return "the prepared rail has a different phase resolution";
    const ring: readonly Vec3[] = guidedRail === undefined
      ? Array.from({ length: samples + 1 }, (_, j): Vec3 => at((turn * j) / samples))
      : [...guidedRail.points, guidedRail.points[0]!];
    const newell: (points: readonly Vec3[]) => {
      centre: Vec3;
      normal: Vec3 | null;
    } = (points: readonly Vec3[]): { centre: Vec3; normal: Vec3 | null } => {
      let centre: Vec3 = [0, 0, 0];
      for (const q of points) centre = add(centre, scale(q, 1 / points.length));
      let area: Vec3 = [0, 0, 0];
      points.forEach((q: Vec3, j: number): void => {
        area = add(
          area,
          cross(sub(q, centre), sub(points[(j + 1) % points.length]!, centre)),
        );
      });
      return { centre, normal: unit(area) };
    };
    const rim: { centre: Vec3; normal: Vec3 | null } = newell(
      ring.slice(0, samples),
    );
    const lap: { centre: Vec3; normal: Vec3 | null } = newell(loop);
    if (rim.normal === null) return "the child's rail ring encloses no area";
    if (lap.normal === null) return "the loop encloses no area";
    const sense: 1 | -1 = dot(rim.normal, lap.normal) > 0 ? 1 : -1;
    // Cumulative arclength round the ring at its samples, and round the loop at its columns.
    const along: number[] = [0];
    for (let j: number = 1; j <= samples; ++j)
      along.push(along[j - 1]! + norm(sub(ring[j]!, ring[j - 1]!)));
    const total: number = along[samples]!;
    const lapAlong: number[] = [0];
    for (let k: number = 1; k <= loop.length; ++k)
      lapAlong.push(
        lapAlong[k - 1]! + norm(sub(loop[k % loop.length]!, loop[k - 1]!)),
      );
    const lapTotal: number = lapAlong[loop.length]!;
    if (!(total > 0 && lapTotal > 0))
      return "the child's rail ring or the loop has no length";
    // The sample at an arclength round the ring: the last whose arclength does not pass it, by bisection.
    const below: (x: number) => number = (x: number): number => {
      let lo: number = 0;
      let hi: number = samples - 1;
      while (lo < hi) {
        const mid: number = (lo + hi + 1) >> 1;
        if (along[mid]! <= x) lo = mid;
        else hi = mid - 1;
      }
      return lo;
    };
    // The phase and the point at an arclength round the ring, read linearly between its samples.
    const phaseAt: (length: number) => number = (length: number): number => {
      const x: number = ((length % total) + total) % total;
      const j: number = below(x);
      const span: number = along[j + 1]! - along[j]!;
      return (turn * (j + (span > 0 ? (x - along[j]!) / span : 0))) / samples;
    };
    const marks = guidedRail?.marks;
    if (marks !== undefined) {
      if (marks.length < 2 || marks[0]!.column !== 0)
        return "the rail correspondence has no ordered fork marks";
      const first: number = marks[0]!.phase;
      const sign: number = Math.sign(marks.at(-1)!.phase - first);
      const lengthAt = (phase: number): number => {
        const cycle: number = Math.floor(phase / turn);
        const at: number = (phase / turn - cycle) * samples;
        const k: number = Math.min(samples - 1, Math.floor(at));
        return cycle * total + along[k]! + (at - k) * (along[k + 1]! - along[k]!);
      };
      const result: number[] = [];
      for (const [i, a] of marks.entries()) {
        const b = marks[i + 1] ?? { column: loop.length, phase: first + sign * turn };
        const source: number = lapAlong[b.column]! - lapAlong[a.column]!;
        const start: number = lengthAt(a.phase);
        const extent: number = lengthAt(b.phase) - start;
        if (!(source > 0 && sign * extent > 0))
          return "the rail correspondence changes direction at a fork";
        for (let k: number = a.column; k < b.column; ++k) {
          const value: number = start + (lapAlong[k]! - lapAlong[a.column]!) * extent / source;
          const wrapped: number = phaseAt(value);
          result.push(k === a.column ? a.phase : wrapped + turn * Math.floor(value / total));
        }
      }
      return result;
    }
    const pointAt: (length: number) => Vec3 = (length: number): Vec3 => {
      const x: number = ((length % total) + total) % total;
      const j: number = below(x);
      const span: number = along[j + 1]! - along[j]!;
      const f: number = span > 0 ? (x - along[j]!) / span : 0;
      return add(scale(ring[j]!, 1 - f), scale(ring[j + 1]!, f));
    };
    // Where round the ring the loop's first column lands: of every sample, the one at which the loop's points and the ring's points taken
    // at the same shares of their lengths stand closest about their own centroids (the least sum of squared distances), the start a loft
    // between two closed curves takes so that the band does not twist. Read by the angle of the loop's first point about the ring's
    // centroid, every toe's band of f1's foot turned 14 to 18 degrees about its toe on average.
    let anchor: number = 0;
    let least: number = Infinity;
    for (let j: number = 0; j < samples; ++j) {
      let cost: number = 0;
      for (let k: number = 0; k < loop.length && cost < least; ++k) {
        const d: Vec3 = sub(
          sub(
            pointAt(along[j]! + sense * (lapAlong[k]! / lapTotal) * total),
            rim.centre,
          ),
          sub(loop[k]!, lap.centre),
        );
        cost += dot(d, d);
      }
      if (cost < least) [least, anchor] = [cost, j];
    }
    const start: number = along[anchor]!;
    const out: number[] = [];
    for (let k: number = 0; k < loop.length; ++k) {
      const psi: number = phaseAt(
        start + sense * (lapAlong[k]! / lapTotal) * total,
      );
      if (k === 0) {
        out.push(psi);
        continue;
      }
      const step: number =
        sense * ((((sense * (psi - out[k - 1]!)) % turn) + turn) % turn);
      if (!(step !== 0))
        return `the child's rail phase does not advance at column ${k}`;
      out.push(out[k - 1]! + step);
    }
    return out;
  }

  /**
   * The child's rail phase at each loop point: the phase whose rail point
   * stands at the loop point's angle about the rail ring's centroid, in the
   * ring's Newell plane; or why none is admitted.
   */
  function phases(child: ISide, loop: readonly Vec3[]): number[] | string {
    const turn: number = 2 * Math.PI;
    const samples: number = 8 * loop.length;
    const at: (psi: number) => Vec3 = (psi: number): Vec3 => [
      ...(child.surface.point?.(railAt(child, psi), psi) ??
        child.surface.jet(railAt(child, psi), psi).p),
    ];
    const ring: Vec3[] = Array.from(
      { length: samples },
      (_: unknown, j: number): Vec3 => at((turn * j) / samples),
    );

    // The ring's centroid and its Newell normal (the polygon's area vector).
    let centre: Vec3 = [0, 0, 0];
    for (const q of ring) centre = add(centre, scale(q, 1 / samples));
    let area: Vec3 = [0, 0, 0];
    ring.forEach((q: Vec3, j: number): void => {
      area = add(
        area,
        cross(sub(q, centre), sub(ring[(j + 1) % samples]!, centre)),
      );
    });
    const normal: Vec3 | null = unit(area);
    if (normal === null) return "the child's rail ring encloses no area";
    const d0: Vec3 = sub(ring[0]!, centre);
    const e1: Vec3 | null = unit(sub(d0, scale(normal, dot(d0, normal))));
    if (e1 === null) return "the child's rail ring starts at its centroid";
    const e2: Vec3 = cross(normal, e1);
    const angle: (p: Vec3) => number = (p: Vec3): number => {
      const d: Vec3 = sub(p, centre);
      return Math.atan2(dot(d, e2), dot(d, e1));
    };
    const wrap: (x: number) => number = (x: number): number =>
      x - turn * Math.round(x / turn);

    // Both curves must turn once, strictly monotonically, round the centroid.
    const unwrap: (
      values: number[],
      what: string,
    ) => { angles: number[]; sense: 1 | -1 } | string = (
      values: number[],
      what: string,
    ): { angles: number[]; sense: 1 | -1 } | string => {
      const angles: number[] = [values[0]!];
      for (let j: number = 1; j <= values.length; ++j)
        angles.push(
          angles[j - 1]! + wrap(values[j % values.length]! - values[j - 1]!),
        );
      const total: number = angles[values.length]! - angles[0]!;
      const sense: 1 | -1 = total > 0 ? 1 : -1;
      if (!(Math.abs(Math.abs(total) - turn) < 1e-6))
        return `the ${what} turns ${total.toFixed(6)} rad round the child's rail centroid, not once`;
      for (let j: number = 1; j < angles.length; ++j)
        if (!(sense * (angles[j]! - angles[j - 1]!) > 0))
          return `the ${what}'s angle round the child's rail centroid is not monotone at ${j - 1}`;
      return { angles, sense };
    };
    const rim: { angles: number[]; sense: 1 | -1 } | string = unwrap(
      ring.map(angle),
      "child's rail ring",
    );
    if (typeof rim === "string") return rim;
    const lap: { angles: number[]; sense: 1 | -1 } | string = unwrap(
      loop.map(angle),
      "loop",
    );
    if (typeof lap === "string") return lap;

    // Invert the ring's unwrapped angle at each loop angle: bracket by the samples, then bisect.
    const found: number[] = lap.angles
      .slice(0, loop.length)
      .map((target: number): number => {
        const base: number = rim.angles[0]!;
        const x: number =
          base +
          rim.sense * ((((rim.sense * (target - base)) % turn) + turn) % turn);
        let j: number = 0;
        while (j < samples - 1 && rim.sense * (rim.angles[j + 1]! - x) < 0) ++j;
        let lo: number = (turn * j) / samples;
        let hi: number = (turn * (j + 1)) / samples;
        const reading: (psi: number) => number = (psi: number): number =>
          rim.angles[j]! + wrap(angle(at(psi)) - rim.angles[j]!);
        for (let step: number = 0; step < 48; ++step) {
          const mid: number = (lo + hi) / 2;
          if (rim.sense * (reading(mid) - x) < 0) lo = mid;
          else hi = mid;
        }
        return (lo + hi) / 2;
      });

    // Unwrap along the clock in the correspondence's direction.
    const direction: number = rim.sense * lap.sense;
    const out: number[] = [found[0]!];
    for (let k: number = 1; k < found.length; ++k) {
      const step: number =
        direction *
        ((((direction * (found[k]! - out[k - 1]!)) % turn) + turn) % turn);
      if (!(step !== 0))
        return `the child's rail phase does not advance at column ${k}`;
      out.push(out[k - 1]! + step);
    }
    return out;
  }
}

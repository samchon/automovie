import type {
  AutoMovieVector3Tuple as P3,
  IAutoMovieSolidSurface as Solid,
} from "@automovie/interface";

import { AutoMovieConstructionSplitCubic as Cubic } from "./AutoMovieConstructionSplitCubic";
import { AutoMovieSolidVector as Vec } from "./AutoMovieSolidVector";

/** A shape-preserving osculating course in one physical radial half-plane. */
export namespace AutoMovieConstructionSplitRadial {
  type HalfSpace = { point: P3; normal: P3 };
  type Source = {
    p: P3;
    d: P3;
    across: P3;
    normalSecond: (tangent: P3) => P3;
  };
  type CourseAt = (t: number) => Cubic.Course;
  type Pace = readonly [speed: number, tangential: number, normal: number];
  type Quintic = [P3, P3, P3, P3, P3, P3];

  /** Hold both observed tangent planes and their normal accelerations. */
  export function course(
    source: Source,
    target: Solid.IJet & { phase: number },
    clock: Cubic.Clock,
    sides: readonly HalfSpace[],
    pace?: { axis: P3; weight: number },
  ): Cubic.Course {
    const ray = clock.ray!(source.p);
    const chord = Vec.sub(target.p, source.p);
    const distance = Vec.norm(chord);
    const forward = Vec.scale(chord, 1 / distance);
    const halfspaces = [...sides, { point: ray.origin, normal: ray.direction }];
    const endpoint = (at: Source, sense: number, limit: P3) => {
      // The radial-plane curve keeps the source's normal curvature. Change
      // only the tangential motion along its original boundary to hold phase.
      const rate = clock.rate(at.p, at.d);
      const planar = (v: P3): P3 =>
        Vec.sub(v, Vec.scale(at.d, clock.rate(at.p, v) / rate));
      const tangent = Vec.unit(planar(at.across))!;
      const speed = Vec.scale(tangent, distance);
      const first = Vec.scale(speed, sense / 5);
      const curvature = planar(at.normalSecond(speed));
      // Tangential acceleration is free in the osculating two-jet. Remove
      // it so incident boundaries with the same plane select the same curve.
      const second = Vec.scale(
        Vec.sub(curvature, Vec.scale(tangent, Vec.dot(curvature, tangent))),
        1 / 20,
      );
      const direction = Vec.scale(forward, sense);
      // The two quintic inner handles use the actual projected two-jet.
      // Their successive projected edges are nonnegative and their second
      // control stays before the midpoint from this end. This is the
      // sufficient Bernstein derivative bound of Dougherty et al. (1989).
      // https://doi.org/10.1090/S0025-5718-1989-0962209-1
      const fractions = [
        prefix(0, Vec.dot(first, direction), Vec.dot(second, direction)),
        prefix(
          Vec.dot(Vec.sub(limit, at.p), direction),
          -2 * Vec.dot(first, direction),
          -Vec.dot(second, direction),
        ),
        ...halfspaces.flatMap(({ point, normal }): number[] => {
          const clearance: number = Vec.dot(Vec.sub(at.p, point), normal);
          const advance: number = Vec.dot(first, normal);
          return [
            prefix(clearance, advance, 0),
            prefix(clearance, 2 * advance, Vec.dot(second, normal)),
          ];
        }),
      ];
      const extent = Math.min(...fractions);
      const e = extent < 1 ? extent * (1 - 16 * Number.EPSILON) : extent;
      return [
        Vec.add(at.p, Vec.scale(first, e)),
        Vec.combine([
          [1, at.p],
          [2 * e, first],
          [e * e, second],
        ]),
      ] as const;
    };
    const midpoint = Vec.scale(Vec.add(source.p, target.p), 1 / 2);
    const [a, b] = endpoint(source, 1, midpoint);
    const [d, c] = endpoint(
      {
        p: target.p,
        d: target.v,
        across: Cubic.unitCross(target),
        normalSecond: (tangent): P3 => Cubic.normalSecond(target, tangent),
      },
      -1,
      midpoint,
    );
    const controls: Quintic = [source.p, a, b, c, d, target.p];
    return {
      controls:
        pace === undefined
          ? controls
          : forwardPace(controls, pace.axis, pace.weight),
      phase: target.phase,
    };
  }

  /** The axis projection is a convex combination with its linear secant. */
  function forwardPace(c: Quintic, axis: P3, weight: number): Quintic {
    const span = Vec.dot(Vec.sub(c[5], c[0]), axis);
    const end = (i: 0 | 1): [P3, P3] => {
      const sense = 1 - 2 * i;
      const p = c[i === 0 ? 0 : 5];
      const handle = c[i === 0 ? 1 : 4];
      const second = c[i === 0 ? 2 : 3];
      const d = Vec.scale(Vec.sub(handle, p), 5 * sense);
      const dd = Vec.scale(
        Vec.combine([
          [1, second],
          [-2, handle],
          [1, p],
        ]),
        20,
      );
      const rate = Vec.dot(d, axis);
      if (!(span > 0 && rate > 0 && weight > 0 && weight <= 1))
        throw new Error(
          "The source does not support the prescribed physical course pace",
        );
      const scale = 1 - weight + (weight * span) / rate;
      const normal = Vec.scale(dd, scale * scale);
      // The scalar projection controls acceleration along its tangent while
      // scaling the original normal curvature quadratically with speed.
      const blend = (1 - weight) * Vec.dot(dd, axis);
      const acceleration = Vec.add(
        normal,
        Vec.scale(d, (blend - Vec.dot(normal, axis)) / rate),
      );
      const tangent = Vec.scale(d, (scale * sense) / 5);
      return [
        Vec.add(p, tangent),
        Vec.combine([
          [1, p],
          [2, tangent],
          [1 / 20, acceleration],
        ]),
      ];
    };
    const [a, b] = end(0);
    const [d, e] = end(1);
    return [c[0], a, b, e, d, c[5]];
  }

  /** Inherit a physical transverse jet in the authored medial course field. */
  export function inherit(
    previous: CourseAt,
    median: CourseAt,
    next: CourseAt,
    clock: Cubic.Clock,
  ): CourseAt {
    const boundaries = [
      preparePace(previous, median, clock, 1),
      preparePace(median, next, clock, -1),
    ];
    return (t) => {
      const base = median(t);
      if (t === 0 || t === 0.5 || t === 1) return base;
      const end: number = t < 0.5 ? 0 : 1;
      const boundary = boundaries[end]!;
      const distance = Math.abs(2 * t - 2 * end);
      const sign = 1 - 2 * end;
      const angle =
        (((sign * (clock.phase(base.controls[0]) - boundary.phase)) % TURN) +
          TURN) %
        TURN;
      // A cubic taper is the lowest degree vanishing with its first two
      // derivatives at the same original central saddle.
      const weight = sign * angle * (1 - distance) ** 3;
      const c = base.controls;
      const axis = angularAxis(clock, c[0]);
      const point = (rail: number, step: Pace): [P3, P3] => {
        const sense = 1 - 2 * rail;
        const p = c[rail === 0 ? 0 : 5]!;
        const a = c[rail === 0 ? 1 : 4]!;
        const b = c[rail === 0 ? 2 : 3]!;
        const d = Vec.scale(Vec.sub(a, p), 5 * sense);
        const len = Vec.norm(d);
        const direction = Vec.scale(d, 1 / len);
        const normal = Vec.unit(Vec.cross(axis, direction))!;
        const advance = weight * step[0];
        const hypotenuse = Math.hypot(len, advance);
        // The positive branch of s - len²/s = 2 advance carries the
        // prescribed derivative at zero, even at a narrow receiving rail.
        // The reciprocal form avoids cancellation on the contracting side.
        const speed =
          advance < 0
            ? len * (len / (hypotenuse - advance))
            : hypotenuse + advance;
        const curvature = Vec.scale(
          Vec.combine([
            [1, b],
            [-2, a],
            [1, p],
          ]),
          20,
        );
        const changed = Vec.combine([
          [(speed / len) ** 2, curvature],
          [weight * step[1], direction],
          [weight * step[2], normal],
        ]);
        const tangent = Vec.scale(direction, (sense * speed) / 5);
        return [
          Vec.add(p, tangent),
          Vec.combine([
            [1, p],
            [2, tangent],
            [1 / 20, changed],
          ]),
        ];
      };
      const [a, b] = point(0, boundary.pace[0]);
      const [d, e] = point(1, boundary.pace[1]);
      return { controls: [c[0], a, b, e, d, c[5]!], phase: base.phase };
    };
  }

  const TURN: number = 2 * Math.PI;
  function angularAxis(clock: Cubic.Clock, point: P3): P3 {
    return Vec.unit([
      clock.rate(point, [1, 0, 0]),
      clock.rate(point, [0, 1, 0]),
      clock.rate(point, [0, 0, 1]),
    ])!;
  }

  /** Read the source pace that makes both angular derivatives share a plane. */
  function preparePace(
    before: CourseAt,
    after: CourseAt,
    clock: Cubic.Clock,
    sign: number,
  ) {
    const c = before(1).controls;
    const tangent = c.slice(1).map((p, i) => Vec.scale(Vec.sub(p, c[i]!), 5));
    const axis = angularAxis(clock, c[0]);
    const derivatives = [before, after].map((read, i) => {
      const span = 2 * i - 1;
      const end = 1 - i;
      // Second-order one-sided derivative in the incident source interval.
      const step = Math.cbrt(Number.EPSILON) / 2;
      const point = read(end).controls;
      const a = read(end + span * step).controls;
      const b = read(end + 2 * span * step).controls;
      const difference = point.map(
        (p, k): P3 =>
          Vec.combine([
            [(2 * span) / step, Vec.sub(a[k]!, p)],
            [-span / (2 * step), Vec.sub(b[k]!, p)],
          ]),
      );
      const rate = clock.rate(point[0], difference[0]!);
      return difference.map((v) => Vec.scale(v, 1 / rate));
    });
    const jump = derivatives[0]!.map((d, i) => Vec.sub(d, derivatives[1]![i]!));
    const shear = [0, 1].map((end): number => {
      const d = tangent[end === 0 ? 0 : 4]!;
      return Vec.dot(jump[5 * end]!, d) / Vec.dot(d, d);
    });
    // The common physical phase supplies rate one.  Its only remaining
    // freedom is shear along the course. Interpolate the measured endpoint
    // shears affinely as in the Chiyokura–Kimura construction.
    // https://doi.org/10.1145/964967.801160
    const target = jump.map(
      (d, i): P3 =>
        Vec.combine([
          [sign, d],
          [(-sign * (5 - i) * shear[0]!) / 5, tangent[i] ?? [0, 0, 0]],
          [(-sign * i * shear[1]!) / 5, tangent[i - 1] ?? [0, 0, 0]],
        ]),
    );
    const pace = (end: number): Pace => {
      const sense = 1 - 2 * end;
      const index = end === 0 ? 0 : 4;
      const len = Vec.norm(tangent[index]!);
      const direction = Vec.scale(tangent[index]!, 1 / len);
      const normal = Vec.unit(Vec.cross(axis, direction))!;
      const speed = 5 * sense * Vec.dot(direction, target[end === 0 ? 1 : 4]!);
      const acceleration = Vec.scale(
        Vec.sub(tangent[end === 0 ? 1 : 4]!, tangent[end === 0 ? 0 : 3]!),
        4,
      );
      const remaining = Vec.combine([
        [20, target[end === 0 ? 2 : 3]!],
        [-8 * sense * speed, direction],
        [(-2 * speed) / len, acceleration],
      ]);
      // Only the generated median supplies a new source curvature derivative.
      // The protected receiving field keeps its measured normal acceleration.
      return [
        speed,
        Vec.dot(remaining, direction),
        end === 0 ? Vec.dot(remaining, normal) : 0,
      ];
    };
    return { phase: clock.phase(c[0]), pace: [pace(0), pace(1)] as const };
  }

  /** First loss of positivity of a scalar control as its speed grows to one. */
  function prefix(initial: number, linear: number, quadratic: number): number {
    const b = Math.max(0, initial);
    if (b === 0) {
      if (linear < 0) return 0;
      return quadratic < 0 ? Math.min(1, -linear / quadratic) : 1;
    }
    if (linear >= 0 && quadratic >= 0) return 1;
    const discriminant = linear * linear - 4 * quadratic * b;
    if (!(discriminant > 0)) return 1;
    const root = Math.sqrt(discriminant);
    return Math.min(
      1,
      linear >= 0
        ? (-linear - root) / (2 * quadratic)
        : (2 * b) / (-linear + root),
    );
  }
}

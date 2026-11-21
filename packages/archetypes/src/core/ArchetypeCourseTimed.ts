import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { ArchetypeCourse } from "./ArchetypeCourse";
import { ArchetypeFrame } from "./ArchetypeFrame";
import { ArchetypeRefusal } from "./ArchetypeRefusal";
import { ArchetypeUnits } from "./ArchetypeUnits";
import { limitMonotoneTangents } from "./limitMonotoneTangents";

/**
 * A timed course interpolates the samples with continuous position and velocity. Equal consecutive marks keep a constant position and the arrival facing, or the departure facing at the start. A moving root faces along its velocity. A dwell admits a restart when its one-sided directions agree.
 *
 * `ArchetypeCourse.timed` is its one caller.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the interpolation, what it keeps continuous and who calls it.
 * @evidence contracts/development/design.md#principled-representation The samples use one shared tangent per knot and an arc-length table. Exactly coincident positions set both boundary tangents to zero. A stationary run uses one facing derived from the adjoining curve.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function, `plan`, and the two constants that set its tables.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace ArchetypeCourseTimed {
  /** Pieces each sample interval is cut into for the arc-length table and the bend scan. */
  export const PIECES: number = 16;

  /** Gauss-Legendre nodes on [-1, 1] and their weights, five points: exact for polynomials to degree nine. */
  export const GAUSS: readonly (readonly [number, number])[] = [
    [0, 128 / 225],
    [
      -Math.sqrt(5 - 2 * Math.sqrt(10 / 7)) / 3,
      (322 + 13 * Math.sqrt(70)) / 900,
    ],
    [
      Math.sqrt(5 - 2 * Math.sqrt(10 / 7)) / 3,
      (322 + 13 * Math.sqrt(70)) / 900,
    ],
    [
      -Math.sqrt(5 + 2 * Math.sqrt(10 / 7)) / 3,
      (322 - 13 * Math.sqrt(70)) / 900,
    ],
    [
      Math.sqrt(5 + 2 * Math.sqrt(10 / 7)) / 3,
      (322 - 13 * Math.sqrt(70)) / 900,
    ],
  ];

  /**
   * A timed course made ready to sample, as `ArchetypeCourse.timed` documents it.
   *
   * @param archetype The name a refusal carries.
   * @param samples The samples.
   * @returns The plan: `depart` at the first sample's second and `stop` at the last, a bend per sample interval where the path turns hardest and one where its balance is worst, and the samplers.
   * @throws {ArchetypeRefusal} As `ArchetypeCourse.timed` states.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the instants and bends it gives, pointing to the documented caller for the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Cubic Hermite interpolation of each coordinate in time with the tangent of the parabola through each sample and its two neighbours (one-sided at the ends, a chord between two samples), which is C1 and passes through every sample, each knot's tangent limited to Fritsch and Carlson's monotone region along the adjacent chords (limitMonotoneTangents) so no interval runs back along its chord, as a cubic out of a hold otherwise would. Speed is the velocity's length, heading its direction seen from above, and curvature (x' z'' - z' x'') over the horizontal speed cubed, positive to the left. Distance is the arc length, integrated by five-point Gauss-Legendre quadrature over `PIECES` pieces per interval, and inverted by Newton's method on the speed, kept inside its piece by bisection where the speed vanishes. Consecutive equal points use a constant position with zero shared endpoint tangents. One adjoining one-sided direction provides facing for the whole hold. A hold with incompatible directions at arrival and restart refuses because the same standing orientation cannot continue onto both moving cubics.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the samples, find equal spans and shared tangents, tabulate arc length, prepare the stationary facing and scan the bends.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The existing bend grid still measures every moving cubic. Equal marks require exact equality in all three coordinates, so no speed, curvature or small displacement on a genuine bend is clamped. A second outside the samples holds the nearer end.
   * @evidence contracts/development/implementation.md#efficient-algorithms Planning sweeps the samples and the piece grid of `PIECES`; a sample finds its interval by binary search and evaluates one cubic; `when` searches the table and takes a few Newton steps.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The tangents and the arc-length table serve every sample of a ride.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan holds the samples, their tangents, stationary spans and facing, and the arc-length table for as long as its caller keeps it.
   */
  export function plan(
    archetype: string,
    samples: readonly ArchetypeCourse.ISample[],
  ): ArchetypeCourse.IPlan {
    const refuse = (
      axis: string,
      value: unknown,
      reason: string,
      fix: string = "give at least two samples of finite points at strictly increasing seconds",
    ): never => {
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype,
        axis,
        value,
        feasible: null,
        reason,
        fix,
      });
    };
    if (samples.length < 2)
      refuse("samples", samples.length, "a timed course needs two samples");
    samples.forEach((sample: ArchetypeCourse.ISample, i: number): void => {
      for (const name of ["seconds", "x", "z"] as const)
        if (!Number.isFinite(sample[name]))
          refuse(
            `samples[${i}].${name}`,
            sample[name],
            "a sample must be finite",
          );
      if (sample.y !== undefined && !Number.isFinite(sample.y))
        refuse(`samples[${i}].y`, sample.y, "a sample must be finite");
      if (i > 0 && !(sample.seconds > samples[i - 1]!.seconds))
        refuse(
          `samples[${i}].seconds`,
          sample.seconds,
          `a sample's second must come after ${samples[i - 1]!.seconds}`,
        );
    });

    // Each sample's point and the tangent of the parabola through it and its neighbours.
    const n: number = samples.length;
    const times: number[] = samples.map(
      (s: ArchetypeCourse.ISample): number => s.seconds,
    );
    const points: IAutoMovieVector3[] = samples.map(
      (s: ArchetypeCourse.ISample): IAutoMovieVector3 => ({
        x: s.x,
        y: s.y ?? 0,
        z: s.z,
      }),
    );
    const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    const held: boolean[] = points
      .slice(1)
      .map((next: IAutoMovieVector3, i: number): boolean => {
        const from: IAutoMovieVector3 = points[i]!;
        return from.x === next.x && from.y === next.y && from.z === next.z;
      });
    const chord = (i: number): IAutoMovieVector3 =>
      Vector3.scale(
        Vector3.subtract(points[i + 1]!, points[i]!),
        1 / (times[i + 1]! - times[i]!),
      );
    const tangents: IAutoMovieVector3[] = points.map(
      (_: IAutoMovieVector3, i: number): IAutoMovieVector3 => {
        if (held[i - 1] || held[i]) return zero;
        if (n === 2) return chord(0);
        if (i === 0) {
          const h0: number = times[1]! - times[0]!;
          const h1: number = times[2]! - times[1]!;
          return Vector3.scale(
            Vector3.subtract(
              Vector3.scale(chord(0), 2 * h0 + h1),
              Vector3.scale(chord(1), h0),
            ),
            1 / (h0 + h1),
          );
        }
        if (i === n - 1) {
          const h0: number = times[n - 2]! - times[n - 3]!;
          const h1: number = times[n - 1]! - times[n - 2]!;
          return Vector3.scale(
            Vector3.subtract(
              Vector3.scale(chord(n - 2), 2 * h1 + h0),
              Vector3.scale(chord(n - 3), h1),
            ),
            1 / (h0 + h1),
          );
        }
        const before: number = times[i]! - times[i - 1]!;
        const after: number = times[i + 1]! - times[i]!;
        return Vector3.scale(
          Vector3.add(
            Vector3.scale(chord(i - 1), after),
            Vector3.scale(chord(i), before),
          ),
          1 / (before + after),
        );
      },
    );

    // Fritsch and Carlson's monotone limit: a start out of a hold never overshoots backward.
    limitMonotoneTangents(times, points, held, tangents);

    // Position, velocity and acceleration at a second inside the samples.
    const interval = (seconds: number): number => {
      let low: number = 0;
      let high: number = n - 1;
      while (high - low > 1) {
        const middle: number = (low + high) >> 1;
        if (times[middle]! <= seconds) low = middle;
        else high = middle;
      }
      return low;
    };
    const evaluate = (
      seconds: number,
    ): {
      point: IAutoMovieVector3;
      velocity: IAutoMovieVector3;
      acceleration: IAutoMovieVector3;
      interval: number;
    } => {
      const t: number = Math.max(times[0]!, Math.min(times[n - 1]!, seconds));
      const i: number = interval(t);
      if (held[i])
        return {
          point: points[i]!,
          velocity: zero,
          acceleration: zero,
          interval: i,
        };
      const h: number = times[i + 1]! - times[i]!;
      const u: number = (t - times[i]!) / h;
      const u2: number = u * u;
      const u3: number = u2 * u;
      const p0: IAutoMovieVector3 = points[i]!;
      const p1: IAutoMovieVector3 = points[i + 1]!;
      const m0: IAutoMovieVector3 = Vector3.scale(tangents[i]!, h);
      const m1: IAutoMovieVector3 = Vector3.scale(tangents[i + 1]!, h);
      const mix = (
        a: number,
        b: number,
        c: number,
        d: number,
      ): IAutoMovieVector3 =>
        Vector3.add(
          Vector3.add(Vector3.scale(p0, a), Vector3.scale(m0, b)),
          Vector3.add(Vector3.scale(p1, c), Vector3.scale(m1, d)),
        );
      return {
        point: mix(
          2 * u3 - 3 * u2 + 1,
          u3 - 2 * u2 + u,
          -2 * u3 + 3 * u2,
          u3 - u2,
        ),
        velocity: Vector3.scale(
          mix(
            6 * u2 - 6 * u,
            3 * u2 - 4 * u + 1,
            -6 * u2 + 6 * u,
            3 * u2 - 2 * u,
          ),
          1 / h,
        ),
        acceleration: Vector3.scale(
          mix(12 * u - 6, 6 * u - 4, -12 * u + 6, 6 * u - 2),
          1 / (h * h),
        ),
        interval: i,
      };
    };
    const speedAt = (seconds: number): number =>
      Vector3.length(evaluate(seconds).velocity);

    // The arc length at the end of every piece, by Gauss-Legendre quadrature of the speed.
    const integrate = (from: number, to: number): number => {
      const half: number = (to - from) / 2;
      const middle: number = (to + from) / 2;
      let sum: number = 0;
      for (const [node, weight] of GAUSS)
        sum += weight * speedAt(middle + half * node);
      return sum * half;
    };
    const knots: number[] = [];
    for (let i: number = 0; i < n - 1; i++)
      for (let k: number = 0; k < PIECES; k++)
        knots.push(times[i]! + ((times[i + 1]! - times[i]!) * k) / PIECES);
    knots.push(times[n - 1]!);
    const arcs: number[] = [0];
    for (let k: number = 1; k < knots.length; k++)
      arcs.push(arcs[k - 1]! + integrate(knots[k - 1]!, knots[k]!));
    const total: number = arcs[arcs.length - 1]!;
    const distanceAt = (seconds: number): number => {
      const t: number = Math.max(times[0]!, Math.min(times[n - 1]!, seconds));
      let low: number = 0;
      let high: number = knots.length - 1;
      while (high - low > 1) {
        const middle: number = (low + high) >> 1;
        if (knots[middle]! <= t) low = middle;
        else high = middle;
      }
      return arcs[low]! + integrate(knots[low]!, t);
    };

    // A heading for every second: the velocity's, or, at rest, the chord's the support rests on, the nearest moving chord, or the start's facing of +Z.
    const chordHeading = (i: number): number | null => {
      for (let step: number = 0; step < n - 1; step++)
        for (const j of [i - step, i + step]) {
          if (j < 0 || j > n - 2) continue;
          const d: IAutoMovieVector3 = Vector3.subtract(
            points[j + 1]!,
            points[j]!,
          );
          if (Math.hypot(d.x, d.z) > 1e-9)
            return Math.atan2(d.x, d.z) / ArchetypeUnits.DEGREE;
        }
      return null;
    };
    // At a zero tangent, the one-sided velocity direction tends to the
    // acceleration leaving the start or to the negated acceleration at arrival.
    const boundaryDirection = (
      i: number,
      leaving: boolean,
    ): IAutoMovieVector3 => {
      const duration: number = times[i + 1]! - times[i]!;
      const displacement: IAutoMovieVector3 = Vector3.subtract(
        points[i + 1]!,
        points[i]!,
      );
      const limit: IAutoMovieVector3 = Vector3.subtract(
        Vector3.scale(displacement, 3),
        Vector3.scale(tangents[leaving ? i + 1 : i]!, duration),
      );
      if (Math.hypot(limit.x, limit.z) > 1e-9) return limit;
      if (Math.hypot(displacement.x, displacement.z) > 1e-9)
        return displacement;
      const heading: number = (chordHeading(i) ?? 0) * ArchetypeUnits.DEGREE;
      return { x: Math.sin(heading), y: 0, z: Math.cos(heading) };
    };
    const firstMotion: number = held.findIndex(
      (paused: boolean): boolean => !paused,
    );
    let holdDirection: IAutoMovieVector3 =
      firstMotion > 0
        ? boundaryDirection(firstMotion, true)
        : { x: 0, y: 0, z: 1 };
    // The facing each held interval keeps, by its index.
    const holdDirections: Map<number, IAutoMovieVector3> = new Map();
    held.forEach((paused: boolean, i: number): void => {
      if (paused) {
        holdDirections.set(i, holdDirection);
        return;
      }
      if (i > firstMotion && held[i - 1]) {
        const before: IAutoMovieVector3 = Vector3.normalize(holdDirection);
        const after: IAutoMovieVector3 = Vector3.normalize(
          boundaryDirection(i, true),
        );
        if (Vector3.distance(before, after) > 1e-8)
          refuse(
            "samples[" + i + "]",
            samples[i],
            "the departure changes the course facing after a hold at " +
              times[i] +
              " s",
            "give the stop a common approach and departure direction or author a continuous turn",
          );
      }
      if (held[i + 1]) holdDirection = boundaryDirection(i, false);
    });
    const facingOf: (direction: IAutoMovieVector3) => IFacing = (
      direction: IAutoMovieVector3,
    ): IFacing => ({
      heading: Math.atan2(direction.x, direction.z) / ArchetypeUnits.DEGREE,
      climb:
        Math.atan2(direction.y, Math.hypot(direction.x, direction.z)) /
        ArchetypeUnits.DEGREE,
    });

    const state = (seconds: number): ArchetypeCourse.IState => {
      const at: ReturnType<typeof evaluate> = evaluate(seconds);
      const v: IAutoMovieVector3 = at.velocity;
      const a: IAutoMovieVector3 = at.acceleration;
      const ground: number = Math.hypot(v.x, v.z);
      const moving: boolean = ground > 1e-9;
      const besideHold: boolean =
        held[at.interval - 1] === true || held[at.interval + 1] === true;

      // A moving root, or one leaving a hold, faces its velocity; a held one
      // its hold's facing, also at the second the hold ends; else its chord.
      const facing: IFacing =
        moving || (besideHold && ground > 0)
          ? facingOf(v)
          : holdDirections.has(at.interval)
            ? facingOf(holdDirections.get(at.interval)!)
            : seconds === times[at.interval] &&
                holdDirections.has(at.interval - 1)
              ? facingOf(holdDirections.get(at.interval - 1)!)
              : { heading: chordHeading(at.interval) ?? 0, climb: 0 };
      const yaw: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        { x: 0, y: 1, z: 0 },
        facing.heading,
      );
      const climb: number = facing.climb;
      const distance: number = distanceAt(seconds);
      return {
        distance,
        speed: Vector3.length(v),
        progress: distance,
        curvature: moving
          ? (a.x * v.z - a.z * v.x) / (ground * ground * ground)
          : 0,
        reverse: false,
        placement: {
          translation: { ...at.point },
          rotation:
            climb === 0
              ? yaw
              : Quaternion.normalize(
                  Quaternion.multiply(
                    yaw,
                    Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -climb),
                  ),
                ),
          scale: { ...ArchetypeFrame.UNIT },
        },
      };
    };

    // Each interval's hardest bend and worst balance on the piece grid, and the fastest speed.
    const bends: ArchetypeCourse.IBend[] = [];
    let peak: number = 0;
    for (let i: number = 0; i < n - 1; i++) {
      let sharpest: ArchetypeCourse.IState | null = null;
      let sharpestAt: number = times[i]!;
      let pulling: ArchetypeCourse.IState | null = null;
      let pullingAt: number = times[i]!;
      for (let k: number = 0; k <= PIECES; k++) {
        const seconds: number =
          times[i]! + ((times[i + 1]! - times[i]!) * k) / PIECES;
        const s: ArchetypeCourse.IState = state(seconds);
        peak = Math.max(peak, s.speed);
        if (
          sharpest === null ||
          Math.abs(s.curvature) > Math.abs(sharpest.curvature)
        ) {
          sharpest = s;
          sharpestAt = seconds;
        }
        if (
          pulling === null ||
          s.speed * s.speed * Math.abs(s.curvature) >
            pulling.speed * pulling.speed * Math.abs(pulling.curvature)
        ) {
          pulling = s;
          pullingAt = seconds;
        }
      }
      for (const [worst, seconds] of [
        [sharpest!, sharpestAt],
        [pulling!, pullingAt],
      ] as const)
        if (Math.abs(worst.curvature) > 0)
          bends.push({
            radiusField: `samples[${i}]`,
            speedField: `samples[${i}]`,
            radius: 1 / Math.abs(worst.curvature),
            speed: worst.speed,
            seconds,
          });
    }

    // Newton's method on the arc length, inside the piece that holds the distance.
    const when = (distance: number): number => {
      if (distance > total) return times[n - 1]!;
      const d: number = Math.max(0, distance);
      let low: number = 0;
      let high: number = knots.length - 1;
      while (high - low > 1) {
        const middle: number = (low + high) >> 1;
        if (arcs[middle]! < d) low = middle;
        else high = middle;
      }
      let left: number = knots[low]!;
      let right: number = knots[high]!;
      let t: number =
        arcs[high]! > arcs[low]!
          ? left +
            ((right - left) * (d - arcs[low]!)) / (arcs[high]! - arcs[low]!)
          : left;
      for (let step: number = 0; step < 50; step++) {
        const error: number = distanceAt(t) - d;
        if (Math.abs(error) < 1e-12) break;
        if (error > 0) right = t;
        else left = t;
        const speed: number = speedAt(t);
        const next: number =
          speed > 1e-12 ? t - error / speed : (left + right) / 2;
        t = next > left && next < right ? next : (left + right) / 2;
      }
      return t;
    };

    return {
      kind: "plan",
      course: { kind: "timed", samples },
      length: total,
      duration: times[n - 1]!,
      peak,
      instants: [
        { seconds: times[0]!, label: "depart" },
        { seconds: times[n - 1]!, label: "stop" },
      ],
      bends,

      // A timed course is samples, not legs.
      legSpans: [],
      when,
      at: state,
    };
  }
}

/** Which way a course's root faces: its heading about `+Y` and its climb, both degrees. */
interface IFacing {
  /** Degrees about `+Y` from `+Z`, positive toward `+X`. */
  heading: number;

  /** Degrees above the floor, positive climbing. */
  climb: number;
}

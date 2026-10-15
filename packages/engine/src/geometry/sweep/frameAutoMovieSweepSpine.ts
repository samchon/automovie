import { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../../math/Vector3";
import { IAutoMovieSweepFrame } from "./IAutoMovieSweepFrame";
import { IAutoMovieSweepPath } from "./IAutoMovieSweepPath";
import { IAutoMovieSweepSpine } from "./IAutoMovieSweepSpine";

/** Transport samples per spine segment; the frame between samples takes one more reflection step. */
const DENSITY: number = 64;

/** Parameter step of the central difference that measures the tangent. */
const STEP: number = 1e-6;

/**
 * Compile a spine into its curve, tangent and rotation-minimizing frames.
 *
 * The curve is the centripetal Catmull-Rom spline through the points (Yuksel,
 * Schaefer and Keyser 2011, Computer-Aided Design 43(7):747-755), which has no
 * cusp or self-intersection within a segment and follows a bent chain closely;
 * the ends continue straight through phantom points reflected from the second
 * and second-last points. A per-coordinate monotone interpolant would stop
 * each coordinate flat at a bent joint and leave a corner there. Within each
 * segment the parameter runs linearly from its start point's chord-length
 * share to its end point's, so stations at those shares sit on the points. The
 * tangent is the central difference of the
 * curve over a parameter step of 1e-6, one-sided at the ends. Frames are
 * transported by the double reflection method of Wang, Juttler, Zheng and Liu
 * (2008, ACM Trans. Graph. 27(1):2): the first axis starts as `spine.normal`
 * made perpendicular to the first tangent, and each step reflects it across
 * the bisector plane of the step's chord and then across the plane that maps
 * the reflected tangent onto the next tangent, which approximates the
 * rotation-minimizing frame to fourth order in the step. The table holds 64
 * steps per spine segment; a query between two entries reflects once more
 * from the entry below it.
 *
 * @param spine The spine, only read.
 * @returns The compiled path.
 * @throws Error when the spine has fewer than two points, a point or the normal is not finite, two consecutive points coincide, the normal is parallel to the first tangent, or the tangent vanishes somewhere on the path.
 *
 * @evidence contracts/common.md#principled-implementation The centripetal Catmull-Rom spline interpolates the points without cusps or self-intersections within a segment, and double reflection is a published fourth-order rotation-minimizing frame integrator; the frame between table entries is one more double reflection, so queries are consistent with the table.
 * @evidence contracts/common.md#clear-and-simple-design One compile step returns a path record of closures; the sweep compiler is the only consumer and asks only for points, tangents and frames.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A vanishing tangent or a normal along the tangent is refused instead of replaced by an arbitrary axis.
 * @evidence contracts/common.md#meaningful-documentation States interpolation, the tangent's difference step, the transport method and its source, the table density, and each refusal.
 * @evidence contracts/performance.md#efficient-algorithms For n points: O(n) chord lengths, a transport table of 64 (n - 1) + 1 frames built in one pass, and O(log n) per query plus one reflection step.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The table is the reuse; a sweep compiles its spine once.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned closures retain the points, knots and the frame table, O(64 n) vectors, released with the path.
 */
export const frameAutoMovieSweepSpine: (spine: IAutoMovieSweepSpine) => IAutoMovieSweepPath = (
  spine: IAutoMovieSweepSpine,
): IAutoMovieSweepPath => {
  const points: IAutoMovieVector3[] = spine.points;
  if (points.length < 2) throw new Error("sweep spine needs at least two points");
  points.forEach((p: IAutoMovieVector3, k: number): void => {
    if (![p.x, p.y, p.z].every(Number.isFinite))
      throw new Error(`sweep spine point ${k} is not finite`);
  });
  if (![spine.normal.x, spine.normal.y, spine.normal.z].every(Number.isFinite))
    throw new Error("sweep spine normal is not finite");
  const chords: number[] = [0];
  for (let k: number = 1; k < points.length; ++k) {
    const chord: number = Vector3.length(Vector3.subtract(points[k]!, points[k - 1]!));
    if (chord === 0) throw new Error(`sweep spine points ${k - 1} and ${k} coincide`);
    chords.push(chords[k - 1]! + chord);
  }
  const length: number = chords[chords.length - 1]!;
  const knots: number[] = chords.map((c: number): number => c / length);
  const n: number = points.length;
  // phantom points continue the path straight beyond its ends
  const at = (k: number): IAutoMovieVector3 =>
    k < 0
      ? Vector3.subtract(Vector3.scale(points[0]!, 2), points[1]!)
      : k >= n
        ? Vector3.subtract(Vector3.scale(points[n - 1]!, 2), points[n - 2]!)
        : points[k]!;
  const clamp = (u: number): number => Math.min(1, Math.max(0, u));
  const point = (u: number): IAutoMovieVector3 => {
    const c: number = clamp(u);
    let k: number = 0;
    while (k < n - 2 && knots[k + 1]! <= c) ++k;
    const s: number = (c - knots[k]!) / (knots[k + 1]! - knots[k]!);
    const p: IAutoMovieVector3[] = [at(k - 1), at(k), at(k + 1), at(k + 2)];
    // Barry and Goldman's pyramid with centripetal knot spacing, the square root of each chord
    const t: number[] = [0];
    for (let i: number = 1; i < 4; ++i)
      t.push(t[i - 1]! + Math.sqrt(Vector3.length(Vector3.subtract(p[i]!, p[i - 1]!))));
    const x: number = t[1]! + s * (t[2]! - t[1]!);
    const mix = (
      a: IAutoMovieVector3,
      b: IAutoMovieVector3,
      ta: number,
      tb: number,
    ): IAutoMovieVector3 => Vector3.lerp(a, b, (x - ta) / (tb - ta));
    const a1: IAutoMovieVector3 = mix(p[0]!, p[1]!, t[0]!, t[1]!);
    const a2: IAutoMovieVector3 = mix(p[1]!, p[2]!, t[1]!, t[2]!);
    const a3: IAutoMovieVector3 = mix(p[2]!, p[3]!, t[2]!, t[3]!);
    const b1: IAutoMovieVector3 = mix(a1, a2, t[0]!, t[2]!);
    const b2: IAutoMovieVector3 = mix(a2, a3, t[1]!, t[3]!);
    return mix(b1, b2, t[1]!, t[2]!);
  };
  const tangent = (u: number): IAutoMovieVector3 => {
    const c: number = clamp(u);
    const a: number = Math.max(0, c - STEP);
    const b: number = Math.min(1, c + STEP);
    const d: IAutoMovieVector3 = Vector3.subtract(point(b), point(a));
    const size: number = Vector3.length(d);
    if (!(size > 0)) throw new Error(`sweep spine tangent vanishes at u = ${c}`);
    return Vector3.scale(d, 1 / size);
  };
  const reflect = (
    from: { origin: IAutoMovieVector3; x: IAutoMovieVector3; normal: IAutoMovieVector3 },
    origin: IAutoMovieVector3,
    normal: IAutoMovieVector3,
  ): IAutoMovieVector3 => {
    const v1: IAutoMovieVector3 = Vector3.subtract(origin, from.origin);
    const c1: number = Vector3.dot(v1, v1);
    if (c1 === 0) return from.x;
    const xl: IAutoMovieVector3 = Vector3.subtract(
      from.x,
      Vector3.scale(v1, (2 / c1) * Vector3.dot(v1, from.x)),
    );
    const tl: IAutoMovieVector3 = Vector3.subtract(
      from.normal,
      Vector3.scale(v1, (2 / c1) * Vector3.dot(v1, from.normal)),
    );
    const v2: IAutoMovieVector3 = Vector3.subtract(normal, tl);
    const c2: number = Vector3.dot(v2, v2);
    const x: IAutoMovieVector3 =
      c2 === 0 ? xl : Vector3.subtract(xl, Vector3.scale(v2, (2 / c2) * Vector3.dot(v2, xl)));
    // remove the rounding drift off the plane before the next step
    return Vector3.normalize(Vector3.subtract(x, Vector3.scale(normal, Vector3.dot(x, normal))));
  };
  const start: IAutoMovieVector3 = tangent(0);
  const first: IAutoMovieVector3 = Vector3.subtract(
    spine.normal,
    Vector3.scale(start, Vector3.dot(spine.normal, start)),
  );
  if (!(Vector3.length(first) > 1e-9 * Math.max(1, Vector3.length(spine.normal))))
    throw new Error("sweep spine normal must not be parallel to its first tangent");
  const samples: number = DENSITY * (points.length - 1);
  const table: Array<{ origin: IAutoMovieVector3; x: IAutoMovieVector3; normal: IAutoMovieVector3 }> = [
    { origin: point(0), x: Vector3.normalize(first), normal: start },
  ];
  for (let i: number = 1; i <= samples; ++i) {
    const u: number = i / samples;
    const origin: IAutoMovieVector3 = point(u);
    const normal: IAutoMovieVector3 = tangent(u);
    table.push({ origin, x: reflect(table[i - 1]!, origin, normal), normal });
  }
  const frame = (u: number): IAutoMovieSweepFrame => {
    const c: number = clamp(u);
    const i: number = Math.min(samples, Math.floor(c * samples));
    const origin: IAutoMovieVector3 = point(c);
    const normal: IAutoMovieVector3 = tangent(c);
    const x: IAutoMovieVector3 =
      i / samples === c ? table[i]!.x : reflect(table[i]!, origin, normal);
    return { origin, x, y: Vector3.cross(normal, x), normal };
  };
  return { length, point, tangent, frame };
};

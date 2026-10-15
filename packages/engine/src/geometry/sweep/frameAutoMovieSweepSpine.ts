import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieSweepFrame } from "./IAutoMovieSweepFrame";
import { IAutoMovieSweepPath } from "./IAutoMovieSweepPath";
import { IAutoMovieSweepSpine } from "./IAutoMovieSweepSpine";
import { IAutoMovieSweepTransport } from "./IAutoMovieSweepTransport";
import { transportAutoMovieSweepSpine } from "./transportAutoMovieSweepSpine";

/**
 * Compile a spine into its curve, tangent and rotation-minimizing frames.
 *
 * The curve is the centripetal Catmull-Rom spline through the points (Yuksel,
 * Schaefer and Keyser 2011, Computer-Aided Design 43(7):747-755), which has no
 * cusp or self-intersection within a segment and follows a bent chain closely;
 * the ends continue straight through phantom points reflected from the second
 * and second-last points. Each segment is evaluated in its equivalent cubic
 * Hermite form, its end derivatives the spline's knot tangents
 * `(P_k - P_k-1) / d_k-1 - (P_k+1 - P_k-1) / (d_k-1 + d_k) + (P_k+1 - P_k) / d_k`
 * over the centripetal spacings `d`, so positions and tangents are closed
 * forms with no difference step and scale with the points exactly. A
 * per-coordinate monotone interpolant would stop each coordinate flat at a
 * bent joint and leave a corner there. A declared end tangent replaces the
 * first or last derivative's direction and keeps its length, so the end
 * segment stays a cubic of the same speed that leaves or reaches its point
 * along the declared direction. Within each segment the parameter
 * runs linearly from its start point's chord-length share to its end
 * point's, so stations at those shares sit on the points. Frames are
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
 * @throws Error when the spine has fewer than two points, a point, the normal or an end tangent is not finite or an end tangent is zero, two consecutive points coincide, the path reverses at a point, the normal is parallel to the first tangent, or the tangent vanishes somewhere on the path.
 *
 * @evidence contracts/common.md#principled-implementation The centripetal Catmull-Rom spline interpolates the points without cusps or self-intersections within a segment, and double reflection is a published fourth-order rotation-minimizing frame integrator; the frame between table entries is one more double reflection, so queries are consistent with the table.
 * @evidence contracts/common.md#clear-and-simple-design The object-returning face of `transportAutoMovieSweepSpine`, which owns the spline and the transport; callers that query a few points use this, posed sweeps rewrite the transport's arrays directly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A vanishing tangent or a normal along the tangent is refused instead of replaced by an arbitrary axis.
 * @evidence contracts/common.md#meaningful-documentation States interpolation, the tangent's difference step, the transport method and its source, the table density, and each refusal.
 * @evidence contracts/performance.md#efficient-algorithms For n points: O(n) chord lengths, a transport table of 64 (n - 1) + 1 frames built in one pass, and O(n) per query to find the segment plus one reflection step; each query allocates only its returned vectors.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The table is the reuse; a sweep compiles its spine once.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned closures retain the transport's arrays, O(64 n) numbers, and a twelve-number scratch, released with the path.
 */
export const frameAutoMovieSweepSpine: (spine: IAutoMovieSweepSpine) => IAutoMovieSweepPath = (
  spine: IAutoMovieSweepSpine,
): IAutoMovieSweepPath => {
  const points: IAutoMovieVector3[] = spine.points;
  const transport: IAutoMovieSweepTransport = transportAutoMovieSweepSpine(points.length, true);
  points.forEach((p: IAutoMovieVector3, k: number): void => {
    transport.points[3 * k] = p.x;
    transport.points[3 * k + 1] = p.y;
    transport.points[3 * k + 2] = p.z;
  });
  const write = (target: Float64Array, v: IAutoMovieVector3 | undefined, what: string): void => {
    if (v === undefined) return;
    if (![v.x, v.y, v.z].every(Number.isFinite) || Math.hypot(v.x, v.y, v.z) === 0)
      throw new Error(`sweep spine ${what} tangent must be finite and not zero`);
    target[0] = v.x;
    target[1] = v.y;
    target[2] = v.z;
  };
  transport.normal[0] = spine.normal.x;
  transport.normal[1] = spine.normal.y;
  transport.normal[2] = spine.normal.z;
  write(transport.start, spine.tangents?.start, "start");
  write(transport.end, spine.tangents?.end, "end");
  transport.update();
  const out: Float64Array = new Float64Array(12);
  const vector = (at: number): IAutoMovieVector3 => ({ x: out[at]!, y: out[at + 1]!, z: out[at + 2]! });
  return {
    length: transport.length(),
    point: (u: number): IAutoMovieVector3 => {
      transport.point(u, out, 0);
      return vector(0);
    },
    tangent: (u: number): IAutoMovieVector3 => {
      transport.tangent(u, out, 0);
      return vector(0);
    },
    frame: (u: number): IAutoMovieSweepFrame => {
      transport.frame(u, out, 0);
      return { origin: vector(0), x: vector(3), y: vector(6), normal: vector(9) };
    },
  };
};

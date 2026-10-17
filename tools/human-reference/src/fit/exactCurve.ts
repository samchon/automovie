import type { fitCurve } from "./fitCurve.ts";

type Point = [number, number, number];

/**
 * Keeps a closed observed contour unchanged by elevating every source edge to a cubic.
 * Critical-event rows use this boundary policy because an ordinary fit tolerance can exceed their branch clearance.
 * Every observed vertex is a span endpoint; the consumer must retain those endpoints during tessellation.
 *
 * @evidence contracts/common.md#principled-implementation A line is represented by its degree-elevated cubic controls, so the mathematical source polygon is unchanged; 1e-10 mm records floating-point allowance rather than interval proof.
 * @evidence contracts/common.md#clear-and-simple-design Owns only exact event-boundary representation; ordinary approximation stays with fitCurve and event selection stays with fitSections.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The policy applies to declared topology-event rows regardless of identity or expected mesh; no anatomical source coordinates are embedded.
 * @evidence contracts/common.md#meaningful-documentation States event-clearance grounds, exact span endpoints, consumer tessellation obligation and floating-point scope.
 * @evidence contracts/performance.md#efficient-algorithms Two complete contour passes compute arclength and cubic controls in O(n) time and O(n) returned space.
 * @evidence contracts/performance.md#reuse-equivalent-work The operation has no cross-call cache; arclength values are computed once and reused for phase and join metadata.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All arrays belong to one synchronous call; there are no file handles, retained processes or global mutable state.
 */
export function exactCurve(input: Point[]): ReturnType<typeof fitCurve> {
  const points: Point[] = input.filter(
    (point: Point, index: number): boolean =>
      !index ||
      point.some(
        (value: number, k: number): boolean => value !== input[index - 1][k],
      ),
  );
  if (
    points.length > 1 &&
    points[0].every(
      (value: number, k: number): boolean =>
        value === points[points.length - 1][k],
    )
  )
    points.pop();
  if (
    points.length < 3 ||
    points.some((point: Point): boolean =>
      point.some((value: number): boolean => !Number.isFinite(value)),
    )
  )
    throw new Error("Event contour needs three distinct finite observations");
  const n: number = points.length,
    cumulative: number[] = [0],
    lo: Point = [Infinity, Infinity, Infinity],
    hi: Point = [-Infinity, -Infinity, -Infinity];
  for (let index: number = 0; index < n; index++) {
    const point: Point = points[index],
      next: Point = points[(index + 1) % n];
    cumulative.push(
      cumulative[index] +
        Math.hypot(
          ...point.map((value: number, k: number): number => next[k] - value),
        ),
    );
    for (let k: number = 0; k < 3; k++) {
      lo[k] = Math.min(lo[k], point[k]);
      hi[k] = Math.max(hi[k], point[k]);
    }
  }
  const segments: ReturnType<typeof fitCurve>["segments"] = points.map(
    (
      point: Point,
      index: number,
    ): ReturnType<typeof fitCurve>["segments"][number] => {
      const next: Point = points[(index + 1) % n];
      const p1: Point = point.map(
        (value: number, k: number): number => value + (next[k] - value) / 3,
      ) as Point;
      const p2: Point = point.map(
        (value: number, k: number): number =>
          value + (2 * (next[k] - value)) / 3,
      ) as Point;
      return {
        p0: point,
        p1,
        p2,
        p3: next,
        t0: cumulative[index] / cumulative[n],
        t1: cumulative[index + 1] / cumulative[n],
        boundMm: 1e-10,
        observedEdgeIntervals: 1,
      };
    },
  );
  const joins: ReturnType<typeof fitCurve>["joins"] = points.map(
    (
      point: Point,
      index: number,
    ): ReturnType<typeof fitCurve>["joins"][number] => {
      const before: Point = points[(index + n - 1) % n],
        after: Point = points[(index + 1) % n];
      const a: Point = point.map(
          (value: number, k: number): number => value - before[k],
        ) as Point,
        b: Point = point.map(
          (value: number, k: number): number => after[k] - value,
        ) as Point;
      const cosine: number =
        a.reduce(
          (sum: number, value: number, k: number): number => sum + value * b[k],
          0,
        ) /
        (Math.hypot(...a) * Math.hypot(...b));
      const angleDeg: number =
        (Math.acos(Math.max(-1, Math.min(1, cosine))) * 180) / Math.PI;
      return {
        t: cumulative[index] / cumulative[n],
        continuity: angleDeg < 1e-5 ? "G1" : "C0",
        angleDeg,
      };
    },
  );
  return {
    closed: true,
    segments,
    bounds: { lo, hi },
    boundMm: 1e-10,
    corners: joins
      .filter(
        (join: ReturnType<typeof fitCurve>["joins"][number]): boolean =>
          join.continuity === "C0",
      )
      .map(
        (join: ReturnType<typeof fitCurve>["joins"][number]): number => join.t,
      ),
    featurePins: [],
    joins,
    observedPoints: n,
  };
}

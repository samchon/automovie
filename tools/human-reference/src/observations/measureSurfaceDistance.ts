import { SurfaceIndex } from "../geometry/SurfaceIndex.ts";
import type { V3 } from "../geometry/V3.ts";
import { add } from "../geometry/add.ts";
import { boundsOf } from "../geometry/boundsOf.ts";
import { cross } from "../geometry/cross.ts";
import { len } from "../geometry/len.ts";
import { mul } from "../geometry/mul.ts";
import { sub } from "../geometry/sub.ts";
import type { EvaluationMesh } from "./EvaluationMesh.ts";

/**
 * Measures 20,000 deterministic area-stratified samples against exact closest triangles; maxima remain observed samples.
 *
 * @evidence contracts/common.md#principled-implementation Systematic area strata select faces and square-root barycentric coordinates sample their interiors, independently of shading.
 * @evidence contracts/common.md#clear-and-simple-design One direction owns sample distances and witnesses; the caller labels omission versus addition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fitted pass threshold, confidence interval or complete-surface bound is inferred.
 * @evidence contracts/common.md#meaningful-documentation States sample count and finite-maximum limits; physical height bins are geometric localization only.
 * @evidence contracts/performance.md#efficient-algorithms Linear area accumulation precedes 20000 data-dependent BVH queries and sorting the resulting scalar errors.
 * @evidence contracts/performance.md#reuse-equivalent-work All samples query one immutable target BVH built by the owning evaluator.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local storage is bounded by face areas, 20000 errors, 20 bins and 40 worst witnesses.
 */
export function measureSurfaceDistance(
  mesh: EvaluationMesh,
  target: SurfaceIndex,
): object {
  const areas: number[] = mesh.triangles.map(
    (t: [number, number, number]): number =>
      len(
        cross(
          sub(mesh.vertices[t[1]], mesh.vertices[t[0]]),
          sub(mesh.vertices[t[2]], mesh.vertices[t[0]]),
        ),
      ) / 2,
  );
  const total: number = areas.reduce(
    (a: number, b: number): number => a + b,
    0,
  );
  if (!(total > 0 && Number.isFinite(total)))
    throw new Error("Evaluation area must be finite and positive");
  const bounds: ReturnType<typeof boundsOf> = boundsOf(mesh.vertices);
  const bins: number[][] = Array.from({ length: 20 }, (): number[] => []);
  const errors: number[] = [];
  const worst: {
    pointMm: V3;
    nearestMm: V3;
    distanceMm: number;
    emittingTriangle: number;
    nearestTriangle: number;
    barycentric: V3;
  }[] = [];
  let triangle: number = 0,
    cumulative: number = areas[0];
  const statistics = (values: number[]): object => {
    if (!values.length) return { count: 0 };
    const sorted: number[] = [...values].sort(
      (a: number, b: number): number => a - b,
    );
    const q = (fraction: number): number =>
      sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))];
    return {
      count: sorted.length,
      median: q(0.5),
      p95: q(0.95),
      p99: q(0.99),
      observedMaximum: q(1),
      mean:
        sorted.reduce((a: number, b: number): number => a + b, 0) /
        sorted.length,
    };
  };
  for (let i: number = 0; i < 20000; i++) {
    const stratum: number = ((i + 0.5) * total) / 20000;
    while (cumulative < stratum && triangle < areas.length - 1)
      cumulative += areas[++triangle];
    const t: [number, number, number] = mesh.triangles[triangle];
    const u: number = Math.sqrt(((i + 1) * 0.6180339887498949) % 1),
      v: number = ((i + 1) * 0.4142135623730951) % 1;
    const barycentric: V3 = [1 - u, u * (1 - v), u * v];
    const point: V3 = add(
      mul(mesh.vertices[t[0]], barycentric[0]),
      add(
        mul(mesh.vertices[t[1]], barycentric[1]),
        mul(mesh.vertices[t[2]], barycentric[2]),
      ),
    );
    const nearest: ReturnType<SurfaceIndex["closest"]> = target.closest(point);
    if (!Number.isFinite(nearest.d))
      throw new Error("No finite closest-triangle witness");
    errors.push(nearest.d);
    bins[
      Math.max(
        0,
        Math.min(
          19,
          Math.floor(
            ((point[1] - bounds.lo[1]) * 20) /
              (bounds.hi[1] - bounds.lo[1] || 1),
          ),
        ),
      )
    ].push(nearest.d);
    if (worst.length < 40 || nearest.d > worst[worst.length - 1].distanceMm) {
      worst.push({
        pointMm: point,
        nearestMm: nearest.q,
        distanceMm: nearest.d,
        emittingTriangle: triangle,
        nearestTriangle: nearest.tri,
        barycentric,
      });
      worst.sort(
        (a: (typeof worst)[number], b: (typeof worst)[number]): number =>
          b.distanceMm - a.distanceMm,
      );
      if (worst.length > 40) worst.pop();
    }
  }
  return {
    errorsMm: statistics(errors),
    areaMm2: total,
    boundsMm: bounds,
    physicalHeightBins: bins.map((values: number[], i: number): object => ({
      lowYmm: bounds.lo[1] + ((bounds.hi[1] - bounds.lo[1]) * i) / 20,
      highYmm: bounds.lo[1] + ((bounds.hi[1] - bounds.lo[1]) * (i + 1)) / 20,
      errorsMm: statistics(values),
    })),
    worst,
  };
}

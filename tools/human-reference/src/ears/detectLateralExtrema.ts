import { EarFoldCandidate } from "./EarFoldCandidate.ts";

/**
 * Finds lateral-coordinate extrema on a source section after uniform arclength
 * sampling. Evaluated points stay on their source segments; the operation does
 * not smooth, project, attach or assign anatomical names to them.
 *
 * The neighborhood and prominence are numerical extraction scales in
 * millimetres. A closed section whose perimeter cannot accommodate both
 * neighborhoods has no qualified candidate at that scale. The neighborhood
 * rounds up to a whole sample interval. Equal plateaus use the preceding-sample
 * tie rule in the open or periodic section order. Open endpoints remain excluded.
 *
 * @param input Source observations in millimetres in the +X left, +Y up, +Z front frame.
 * @param closed Whether the last segment returns to the first observation.
 * @param outwardSign Subject-left uses +1 and subject-right uses -1.
 * @param options Positive sampling and neighborhood dimensions, nonnegative prominence, and an explicit allocation budget.
 * @returns Independent geometric candidates; the input remains unchanged.
 * @throws When coordinates, dimensions or the requested allocation are invalid.
 *
 * @evidence contracts/common.md#principled-implementation Piecewise-linear arclength interpolation preserves the admitted source sections; finite-neighborhood signed extrema qualify geometric turns without anatomical inference.
 * @evidence contracts/common.md#clear-and-simple-design Sampling and extrema selection stay together because the neighborhood radius is defined in the sampler's physical arclength metric.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The algorithm contains no identity-specific cases, source indices or expected feature counts.
 * @evidence contracts/common.md#meaningful-documentation The contract states the source frame, physical units, plateau rule, endpoint exclusion, allocation limit and unresolved anatomy.
 * @evidence contracts/performance.md#efficient-algorithms For N source vertices and M requested samples, one cumulative scan and monotone source-segment cursor take O(N+M); extrema selection takes O(MR) for neighborhood radius R samples and retains O(N+M) values.
 * @evidence contracts/performance.md#reuse-equivalent-work Cumulative lengths and evaluated source points are reused for both signed extrema during this invocation; there is no cross-request cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary arrays are invocation-owned and bounded by source observations and the explicit maxSamples budget; only returned candidates outlive the call.
 */
export function detectLateralExtrema(
  input: readonly (readonly [number, number, number])[],
  closed: boolean,
  outwardSign: 1 | -1,
  options: {
    sampleStepMm: number;
    neighborhoodRadiusMm: number;
    minimumProminenceMm: number;
    maxSamples: number;
  },
): EarFoldCandidate[] {
  if (
    !(options.sampleStepMm > 0) ||
    !Number.isFinite(options.sampleStepMm) ||
    !(options.neighborhoodRadiusMm > 0) ||
    !Number.isFinite(options.neighborhoodRadiusMm) ||
    !(options.minimumProminenceMm >= 0) ||
    !Number.isFinite(options.minimumProminenceMm) ||
    !Number.isSafeInteger(options.maxSamples) ||
    options.maxSamples < 2 ||
    (outwardSign !== 1 && outwardSign !== -1)
  )
    throw new Error(
      "Finite physical extraction dimensions and an integer sample budget are required",
    );
  if (
    input.some(
      (point: readonly number[]): boolean =>
        point.length !== 3 ||
        point.some((value: number): boolean => !Number.isFinite(value)),
    )
  )
    throw new Error(
      "Finite three-dimensional source observations are required",
    );
  if (input.length < (closed ? 3 : 2)) return [];
  const edgeCount: number = input.length - (closed ? 0 : 1);
  const cumulative: number[] = [0];
  for (let i: number = 0; i < edgeCount; i++) {
    const a: readonly [number, number, number] = input[i];
    const b: readonly [number, number, number] = input[(i + 1) % input.length];
    cumulative.push(
      cumulative[i] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]),
    );
  }
  const perimeter: number = cumulative[edgeCount];
  if (!Number.isFinite(perimeter))
    throw new Error("Source arclength exceeds the finite coordinate domain");
  if (perimeter < options.neighborhoodRadiusMm * 2) return [];
  const intervals: number = Math.ceil(perimeter / options.sampleStepMm);
  const sampleCount: number = intervals + (closed ? 0 : 1);
  if (!Number.isSafeInteger(sampleCount) || sampleCount > options.maxSamples)
    throw new Error(
      "Source-section sampling exceeds the admitted allocation budget",
    );
  const step: number = perimeter / intervals;
  const radius: number = Math.ceil(options.neighborhoodRadiusMm / step);
  const points: [number, number, number][] = [];
  let edge: number = 0;
  for (let i: number = 0; i < sampleCount; i++) {
    const arc: number = i * step;
    while (edge < edgeCount - 1 && cumulative[edge + 1] <= arc) edge++;
    const edgeLength: number = cumulative[edge + 1] - cumulative[edge];
    const fraction: number =
      edgeLength > 0 ? (arc - cumulative[edge]) / edgeLength : 0;
    const a: readonly [number, number, number] = input[edge];
    const b: readonly [number, number, number] =
      input[(edge + 1) % input.length];
    points.push([
      a[0] + fraction * (b[0] - a[0]),
      a[1] + fraction * (b[1] - a[1]),
      a[2] + fraction * (b[2] - a[2]),
    ]);
  }
  const result: EarFoldCandidate[] = [];
  for (let i: number = 0; i < sampleCount; i++) {
    if (!closed && (i < radius || i + radius >= sampleCount)) continue;
    const lateral: number = outwardSign * points[i][0];
    const previous: number =
      outwardSign * points[(i - radius + sampleCount) % sampleCount][0];
    const next: number = outwardSign * points[(i + radius) % sampleCount][0];
    for (const direction of [-1, 1] as const) {
      const prominence: number = Math.min(
        direction * (lateral - previous),
        direction * (lateral - next),
      );
      if (prominence < options.minimumProminenceMm) continue;
      let extremal: boolean = true;
      for (
        let offset: number = -radius;
        offset <= radius && extremal;
        offset++
      ) {
        if (!offset) continue;
        const neighbour: number = (i + offset + sampleCount) % sampleCount;
        const difference: number =
          direction * (outwardSign * points[neighbour][0] - lateral);
        // The tolerance resolves floating-point ties in physical source units.
        if (difference > 1e-9 || (Math.abs(difference) <= 1e-9 && offset < 0))
          extremal = false;
      }
      if (extremal)
        result.push({
          point: points[i],
          direction: direction > 0 ? "outward" : "inward",
          prominenceMm: prominence,
          arcMm: i * step,
        });
    }
  }
  return result;
}

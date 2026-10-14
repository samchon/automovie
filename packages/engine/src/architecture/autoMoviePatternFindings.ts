import { positiveModulo } from "../math/positiveModulo";
import { IAutoMoviePatternFinding } from "./IAutoMoviePatternFinding";
import { IAutoMoviePatternPlacement } from "./IAutoMoviePatternPlacement";
import { IAutoMoviePatternPoint } from "./IAutoMoviePatternPoint";
import { IAutoMovieSurfacePattern } from "./IAutoMovieSurfacePattern";

/** Smallest metre length counted as a real gap or overlap. */
const LENGTH_EPSILON: number = 1e-9;

/** Smallest surviving-fraction shortfall counted as a real sliver. */
const COVERAGE_EPSILON: number = 1e-12;

/**
 * Measure every laid piece and every neighbouring pair against the declaration.
 *
 * Per-piece findings come first, in placement order, so a defect that belongs
 * to one piece is never buried under the pair findings its neighbours produced:
 * a `sliver` when its surviving coverage is below `minimumPiece`, and an
 * `unsupported-piece` when an exclusion punched it, because the convex
 * procedural kernel has no boolean difference to build that piece. Pair
 * findings follow for each piece against its later neighbours in placement
 * order: a `module-overlap` when the pieces interpenetrate, otherwise, within
 * the adjacency gap, a `joint-deviation` when the joint is off `joint` by more
 * than `jointTolerance`, and a `grain-break` when the grain turns by more than
 * `grainToleranceDeg`, unless that tolerance is null.
 *
 * Candidate pairs share a centre bucket or one of its eight neighbours. The cell width is the largest module diagonal plus adjacency. With finite, well-scaled generated convex geometry, Euclidean-near pieces fit this broad phase because each lies within half its module diagonal of its centre. Partners are sorted by placement index before measurement.
 *
 * The narrow phase uses the largest edge-normal projection gap, not Euclidean distance. A diagonally distant pair inside neighbouring buckets can therefore still report a small joint; a projection-close pair outside those buckets is not tested. Findings describe this combined bucket/projection policy, not exhaustive Euclidean or projection-gap neighbourhoods. Measurements use clipped outlines rather than uncut module rectangles.
 *
 * @param pattern The validated declaration whose limits are applied.
 * @param placements The run's placements, in run order.
 * @returns Every quality finding, per-piece findings first.
 *
 * @evidence contracts/common.md#principled-implementation Combines adjacent centre buckets with separating-axis projection gaps over clipped convex outlines; grain directions compare modulo 180 degrees. The ideal convex SAT overlap theorem requires nondegenerate geometry and finite intermediate arithmetic, which extreme finite coordinates alone do not guarantee. No Euclidean-distance narrow-phase filter is performed.
 * @evidence contracts/common.md#clear-and-simple-design Split from the pattern run so laying and judging are separate responsibilities: the run produces placements and this reads only them and the declared limits.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no zone, module or material. Declared limits plus fixed length/coverage comparison slack apply to every placement; that slack is an acceptance policy, not a proved bound on arbitrary binary64 error.
 * @evidence contracts/common.md#meaningful-documentation States finding thresholds/order, the centre-bucket candidate rule, sorted partners, edge-normal measurement and its difference from Euclidean neighbourhoods, plus the generated-geometry and arithmetic premises.
 * @evidence contracts/performance.md#efficient-algorithms O(N) bucket construction plus candidate gathering and sum(k_i log k_i) partner sorting. Each judged pair with Vi/Vj vertices costs O((Vi + Vj)²), projecting both outlines for every edge normal. Dense buckets can produce N² pairs; outline sizes and candidate density have no fixed small bound.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Judges one run's placements per call; the bucket grid is built once per call and serves every piece.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Buckets and the largest per-piece partner set/sorted array use O(N) local storage, released on return. Returned findings can use O(N²) records; the caller owns them, with no silent truncation cap.
 */
export const autoMoviePatternFindings: (
  pattern: IAutoMovieSurfacePattern,
  placements: readonly IAutoMoviePatternPlacement[],
) => IAutoMoviePatternFinding[] = (
  pattern: IAutoMovieSurfacePattern,
  placements: readonly IAutoMoviePatternPlacement[],
): IAutoMoviePatternFinding[] => {
  const findings: IAutoMoviePatternFinding[] = [];
  for (const placement of placements) {
    if (placement.coverage < pattern.minimumPiece - COVERAGE_EPSILON)
      findings.push({
        kind: "sliver",
        occurrences: [placement.id],
        measured: placement.coverage,
        limit: pattern.minimumPiece,
        detail: `occurrence "${placement.id}" survives at ${placement.coverage} of a module, below the ${pattern.minimumPiece} minimum piece`,
      });
    if (placement.punchedArea > 0)
      findings.push({
        kind: "unsupported-piece",
        occurrences: [placement.id],
        measured: placement.punchedArea,
        limit: 0,
        detail: `occurrence "${placement.id}" is cut by an exclusion, so its true piece is the outline minus that area; the convex procedural kernel has no boolean difference and cannot build it`,
      });
  }
  if (placements.length === 0) return findings;

  let largest: number = 0;
  for (const placement of placements)
    largest = Math.max(
      largest,
      Math.sqrt(
        placement.size.u * placement.size.u +
          placement.size.v * placement.size.v,
      ),
    );
  const cellSize: number = largest + pattern.adjacency;
  const buckets: Map<string, number[]> = new Map();
  placements.forEach(
    (placement: IAutoMoviePatternPlacement, index: number): void => {
      const key: string = bucketKey(placement, cellSize, 0, 0);
      const bucket: number[] | undefined = buckets.get(key);
      if (bucket === undefined) buckets.set(key, [index]);
      else bucket.push(index);
    },
  );
  placements.forEach(
    (placement: IAutoMoviePatternPlacement, index: number): void => {
      const partners: Set<number> = new Set();
      for (let du: number = -1; du <= 1; ++du)
        for (let dv: number = -1; dv <= 1; ++dv)
          for (const candidate of buckets.get(
            bucketKey(placement, cellSize, du, dv),
          ) ?? [])
            if (candidate > index) partners.add(candidate);
      for (const partner of [...partners].sort(
        (left: number, right: number): number => left - right,
      ))
        judgePair(pattern, placement, placements[partner]!, findings);
    },
  );
  return findings;
};

/** Append the pair findings one neighbouring pair raises. */
const judgePair: (
  pattern: IAutoMovieSurfacePattern,
  placement: IAutoMoviePatternPlacement,
  other: IAutoMoviePatternPlacement,
  findings: IAutoMoviePatternFinding[],
) => void = (
  pattern: IAutoMovieSurfacePattern,
  placement: IAutoMoviePatternPlacement,
  other: IAutoMoviePatternPlacement,
  findings: IAutoMoviePatternFinding[],
): void => {
  const gap: number = separation(placement.outline, other.outline);
  if (gap < -LENGTH_EPSILON) {
    findings.push({
      kind: "module-overlap",
      occurrences: [placement.id, other.id],
      measured: gap,
      limit: 0,
      detail: `occurrences "${placement.id}" and "${other.id}" overlap by ${-gap} m instead of leaving a joint`,
    });
    return;
  }
  if (gap > pattern.adjacency + LENGTH_EPSILON) return;
  if (Math.abs(gap - pattern.joint) > pattern.jointTolerance + LENGTH_EPSILON)
    findings.push({
      kind: "joint-deviation",
      occurrences: [placement.id, other.id],
      measured: gap,
      limit: pattern.joint,
      detail: `occurrences "${placement.id}" and "${other.id}" are ${gap} m apart, off the ${pattern.joint} m joint by more than the ${pattern.jointTolerance} m tolerance`,
    });
  if (pattern.grainToleranceDeg === null) return;
  const deviation: number = grainDeviation(placement.grainDeg, other.grainDeg);
  if (deviation > pattern.grainToleranceDeg + LENGTH_EPSILON)
    findings.push({
      kind: "grain-break",
      occurrences: [placement.id, other.id],
      measured: deviation,
      limit: pattern.grainToleranceDeg,
      detail: `neighbouring occurrences "${placement.id}" and "${other.id}" run their grain ${deviation}° apart, above the ${pattern.grainToleranceDeg}° tolerance`,
    });
};

/** The grid cell key of a placement's centre, offset by whole cells. */
const bucketKey: (
  placement: IAutoMoviePatternPlacement,
  cellSize: number,
  du: number,
  dv: number,
) => string = (
  placement: IAutoMoviePatternPlacement,
  cellSize: number,
  du: number,
  dv: number,
): string =>
  `${Math.floor(placement.center.u / cellSize) + du},${Math.floor(placement.center.v / cellSize) + dv}`;

/** Smallest in-plane angle between two 180-periodic grain directions. */
const grainDeviation: (left: number, right: number) => number = (
  left: number,
  right: number,
): number => {
  const delta: number = positiveModulo(left - right, 180);
  return Math.min(delta, 180 - delta);
};

/**
 * The gap between two convex pieces, measured along their own edge normals.
 *
 * A joint is read perpendicular to the edges it separates, which is exactly the
 * separating-axis measurement: the largest projection gap over both pieces'
 * edge normals. A negative result is a real overlap, because no axis separated
 * them.
 */
const separation: (
  left: readonly IAutoMoviePatternPoint[],
  right: readonly IAutoMoviePatternPoint[],
) => number = (
  left: readonly IAutoMoviePatternPoint[],
  right: readonly IAutoMoviePatternPoint[],
): number => {
  let best: number = Number.NEGATIVE_INFINITY;
  for (const polygon of [left, right])
    for (let index: number = 0; index < polygon.length; ++index) {
      const from: IAutoMoviePatternPoint = polygon[index]!;
      const to: IAutoMoviePatternPoint = polygon[(index + 1) % polygon.length]!;
      const axis: IAutoMoviePatternPoint = {
        u: -(to.v - from.v),
        v: to.u - from.u,
      };
      const length: number = Math.sqrt(axis.u * axis.u + axis.v * axis.v);
      const normal: IAutoMoviePatternPoint = {
        u: axis.u / length,
        v: axis.v / length,
      };
      const a: { min: number; max: number } = project(left, normal);
      const b: { min: number; max: number } = project(right, normal);
      best = Math.max(best, Math.max(b.min - a.max, a.min - b.max));
    }
  return best;
};

/** The interval a polygon's corners cover along one unit axis. */
const project: (
  polygon: readonly IAutoMoviePatternPoint[],
  axis: IAutoMoviePatternPoint,
) => { min: number; max: number } = (
  polygon: readonly IAutoMoviePatternPoint[],
  axis: IAutoMoviePatternPoint,
): { min: number; max: number } => {
  let min: number = Number.POSITIVE_INFINITY;
  let max: number = Number.NEGATIVE_INFINITY;
  for (const point of polygon) {
    const value: number = point.u * axis.u + point.v * axis.v;
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  return { min, max };
};

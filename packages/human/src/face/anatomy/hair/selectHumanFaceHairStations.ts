import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Choose the stations of an integrated hair curve that a ribbon needs, so a near-straight run is one segment and a bend keeps the stations that carry it.
 *
 * The result is a strictly increasing list of indices into `points`, always holding the first and last. Every dropped station lies within the segment's tolerance of the straight segment between the two kept stations around it (Ramer-Douglas-Peucker on the station polyline, measured to the segment and not to its infinite line). The tolerance is asked per segment, `tolerance(a, b)` for the kept stations `a < b` that bound it, so a ribbon that narrows toward its tip can tighten there; a nonpositive tolerance keeps every station that is not exactly on the segment. Stations are never moved or resampled: the result is a subset of the integrated ones.
 *
 * Deviation is compared against the chord, so the choice depends on the curve and the caller's tolerance only, never on a style or a subject. The walk uses an explicit stack, so a curve of any length cannot overflow the call stack.
 *
 * @evidence contracts/common.md#principled-implementation Iterative segment-distance Ramer-Douglas-Peucker selects a strictly increasing subset of actual curve stations.
 * @evidence contracts/common.md#clear-and-simple-design Per-segment tolerance lets the ribbon's nominal width/clearance govern simplification without resampling.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This deviation bound does not certify swept geometry or hair contact; malformed tolerance inputs are not independently admitted here.
 * @evidence contracts/common.md#meaningful-documentation First/last are retained and nonpositive tolerance preserves each station with nonzero deviation.
 * @evidence contracts/performance.md#efficient-algorithms Worst-case split scans are O(n squared), plus O(k log k) retained-index sorting, with an explicit stack instead of recursion.
 * @evidence contracts/performance.md#reuse-equivalent-work Each segment's chord/span and tolerance are computed once for its intermediate-point scan.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Pending intervals and kept indices use O(n) storage local to the call; the point array remains borrowed.
 */
export function selectHumanFaceHairStations(props: {
  points: readonly IAutoMovieVector3[];
  tolerance: (from: number, to: number) => number;
}): number[] {
  const {
    points,
  }: {
    points: readonly IAutoMovieVector3[];
    tolerance: (from: number, to: number) => number;
  } = props;
  if (points.length <= 2)
    return points.map((_: IAutoMovieVector3, at: number): number => at);
  const kept: Set<number> = new Set<number>([0, points.length - 1]);
  const pending: [number, number][] = [[0, points.length - 1]];
  while (pending.length !== 0) {
    const [from, to]: [number, number] = pending.pop()!;
    if (to - from < 2) continue;
    const limit: number = props.tolerance(from, to);
    const chord: IAutoMovieVector3 = Vector3.subtract(points[to], points[from]);
    const span: number = Vector3.dot(chord, chord);
    let worst: number = 0,
      at: number = -1;
    for (let i: number = from + 1; i < to; i++) {
      const offset: IAutoMovieVector3 = Vector3.subtract(
        points[i],
        points[from],
      );
      const along: number =
        span === 0
          ? 0
          : Math.max(0, Math.min(1, Vector3.dot(offset, chord) / span));
      const gap: number = Vector3.length(
        Vector3.subtract(offset, Vector3.scale(chord, along)),
      );
      if (gap > worst) {
        worst = gap;
        at = i;
      }
    }
    if (at !== -1 && worst > limit) {
      kept.add(at);
      pending.push([from, at], [at, to]);
    }
  }
  return [...kept].sort((a: number, b: number): number => a - b);
}

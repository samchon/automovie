import type { IHumanFaceProjectedSkinCourseReading } from "./IHumanFaceProjectedSkinCourseReading";
import type { IHumanFaceProjectedSkinSpan } from "./IHumanFaceProjectedSkinSpan";

/**
 * Read extrinsic distance and arc station on finite source-supported spans.
 * Unit chord directions avoid division by a squared length that can underflow
 * for a representable short course. Hypot also preserves subnormal distances.
 * Projection onto the closed span uses its endpoints as genuine geometric
 * bounds, not a clamp of an anatomical input or a change in the relief width.
 *
 * @evidence contracts/common.md#principled-implementation Each finite span uses a unit chord and endpoint-bounded projection to read extrinsic distance and normalized cumulative station, avoiding squared-length underflow; compiled spans/metric validity remain producer premises.
 * @evidence contracts/common.md#clear-and-simple-design One point-to-span reader serves free projection and native chart courses; their compilers retain topology and metric admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Endpoint projection bounds are geometric, not clamped anatomical inputs. Strictly nearer spans replace the current result, so ties retain earlier course order; an empty span list reports Infinity and station zero rather than fabricated support.
 * @evidence contracts/common.md#meaningful-documentation The prose states extrinsic metre distance, finite XYZ input, subnormal arithmetic and genuine closed-segment bounds; empty/constant course meaning remains explicit in its producer.
 * @evidence contracts/performance.md#efficient-algorithms One read scans S spans with fixed XYZ dot/hypot work, O(S) time and fixed transient vectors; the scan selects the nearest complete span without reconstructing native features or their exact envelope.
 * @evidence contracts/performance.md#reuse-equivalent-work Every read reuses precompiled endpoints, lengths and cumulative stations; the point itself may differ, so no stale nearest reading is cached across vertices or geometry changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All vectors and the scalar reading are invocation-local; source spans remain borrowed and no cache, handle or task survives return/refusal.
 *
 * @author Samchon
 */
export function readHumanFaceProjectedSkinCourse(
  spans: readonly IHumanFaceProjectedSkinSpan[],
  totalLengthMetres: number,
  point: readonly number[],
): IHumanFaceProjectedSkinCourseReading {
  if (point.length !== 3 || point.some((value: number): boolean  => !Number.isFinite(value)))
    throw new Error(
      "Skin course reading needs a finite three-coordinate point.",
    );
  let distanceMetres: number = Infinity,
    station: number = 0;
  for (const span of spans) {
    if (span.lengthMetres === 0) {
      const distance: number = Math.hypot(
        ...point.map((value: number, axis: number): number  => value - span.start[axis]),
      );
      if (distance < distanceMetres) {
        distanceMetres = distance;
        station =
          totalLengthMetres > 0
            ? span.precedingLengthMetres / totalLengthMetres
            : 0;
      }
      continue;
    }
    const direction: number[] = span.end.map(
      (value: number, axis: number): number  => (value - span.start[axis]) / span.lengthMetres,
    );
    const offset: number[] = point.map((value: number, axis: number): number  => value - span.start[axis]);
    const along: number =
      offset[0] * direction[0] +
      offset[1] * direction[1] +
      offset[2] * direction[2];
    const reach: number = Math.max(0, Math.min(span.lengthMetres, along));
    const distance: number = Math.hypot(
      ...offset.map((value: number, axis: number): number  => value - reach * direction[axis]),
    );
    if (distance < distanceMetres) {
      distanceMetres = distance;
      station = (span.precedingLengthMetres + reach) / totalLengthMetres;
    }
  }
  return { distanceMetres, station };
}

import type { IHumanFaceProjectedSkinCourseReading as IHumanFaceProjectedSkinCourseReadingImported } from "./IHumanFaceProjectedSkinCourseReading";
import type { IHumanFaceSkinChartCourse } from "./IHumanFaceSkinChartCourse";
import type { IHumanFaceSkinChartMetricSpan } from "./IHumanFaceSkinChartMetricSpan";
import type { IHumanFaceSkinChartSpan } from "./IHumanFaceSkinChartSpan";
import type { IHumanFaceSkinFrame as IHumanFaceSkinFrameImported } from "./IHumanFaceSkinFrame";
import { readHumanFaceProjectedSkinCourse } from "./readHumanFaceProjectedSkinCourse";

/**
 * Measure one lifted native course for attachment and skin relief.
 * Positive affine intervals own their head-frame hypot length and preceding
 * station. Constant intervals add no length and coincide with their joined
 * neighbors; an entirely constant course has no effective relief. A positive
 * length that cannot advance the represented accumulated station refuses.
 *
 * Euclidean distance retains the existing point-to-span instrument. Native
 * frames follow the same interval's barycentrics without nearest reseating.
 * These are geometric quantities, not intrinsic geodesic or clinical length.
 * Endpoints are copied before metric compilation, so later caller-array
 * changes cannot mix new coordinates with old lengths. Frame callbacks must
 * continue to read their original immutable native host state; a callback's
 * captured geometry is owned by the chart, not copied by this metric reader.
 *
 * @evidence contracts/common.md#principled-implementation Copied native endpoints yield hypot lengths and strictly advancing represented arc stations; constant spans add no length, and frame reads interpolate the chosen native span's original barycentrics without reseating.
 * @evidence contracts/common.md#clear-and-simple-design Metric compilation owns endpoints, cumulative lengths and distance-to-span selection; native topology/frame callbacks remain with the source chart and relief width remains with the kernel.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonadvancing positive accumulated lengths and out-of-course frames refuse rather than accepting a zero-effect course or independently querying a nearest sheet; empty metrics cannot supply a frame.
 * @evidence contracts/common.md#meaningful-documentation The prose gives Euclidean rather than geodesic length, zero-length semantics, endpoint-copy ownership and immutable callback-state premises.
 * @evidence contracts/performance.md#efficient-algorithms Compiling S native spans costs O(S) fixed XYZ work/storage; each distance or physical frame query currently scans the metric spans, avoiding repeated endpoint/length reconstruction but making no logarithmic-search claim.
 * @evidence contracts/performance.md#reuse-equivalent-work Endpoints, lengths and preceding stations are computed once for repeated reads; callbacks retain the same immutable host, so geometry/reference changes invalidate the entire metric rather than only cumulative lengths.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned course closures retain O(S) copied metric spans and chart-owned frame callbacks until their consumer releases the course; compilation failure commits no result and no global handle or task exists.
 *
 * @author Samchon
 */
export function createHumanFaceSkinChartCourse(
  native: readonly IHumanFaceSkinChartSpan[],
): IHumanFaceSkinChartCourse {
  const spans: IHumanFaceSkinChartMetricSpan[] = [];
  let totalLengthMetres: number = 0;
  for (const span of native) {
    const start: number[] = [...span.start],
      end: number[] = [...span.end];
    const lengthMetres: number = Math.hypot(
      ...end.map((value: number, axis: number): number => value - start[axis]),
    );
    if (lengthMetres === 0) continue;
    const next: number = totalLengthMetres + lengthMetres;
    if (!(next > totalLengthMetres) || !Number.isFinite(next))
      throw new Error(
        "A native skin course needs representable positive arc stations.",
      );
    spans.push({
      triangle: span.triangle,
      start,
      end,
      frameAt: span.frameAt,
      lengthMetres,
      precedingLengthMetres: totalLengthMetres,
    });
    totalLengthMetres = next;
  }
  return {
    spans,
    totalLengthMetres,
    read: (
      point: readonly number[],
    ): IHumanFaceProjectedSkinCourseReadingImported =>
      readHumanFaceProjectedSkinCourse(spans, totalLengthMetres, point),
    frameAt: (distance: number): IHumanFaceSkinFrameImported => {
      if (
        !Number.isFinite(distance) ||
        distance < 0 ||
        distance > totalLengthMetres ||
        spans.length === 0
      )
        throw new Error(
          "A native course frame needs a distance within a nonzero physical course.",
        );
      const span: IHumanFaceSkinChartMetricSpan = spans.find(
        (piece: IHumanFaceSkinChartMetricSpan): boolean =>
          distance <= piece.precedingLengthMetres + piece.lengthMetres,
      )!;
      const end: number = span.precedingLengthMetres + span.lengthMetres;
      const fraction: number =
        distance === span.precedingLengthMetres
          ? 0
          : distance === end
            ? 1
            : (distance - span.precedingLengthMetres) / span.lengthMetres;
      return span.frameAt(fraction);
    },
  };
}

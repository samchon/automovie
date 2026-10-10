import type { IHumanFaceSkinChartCourse } from "./IHumanFaceSkinChartCourse";
import type { IHumanFaceSkinChartMetricSpan } from "./IHumanFaceSkinChartMetricSpan";
import type { IHumanFaceSkinChartSpan } from "./IHumanFaceSkinChartSpan";
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
 * @author Samchon
 */
export function createHumanFaceSkinChartCourse(
  native: readonly IHumanFaceSkinChartSpan[],
): IHumanFaceSkinChartCourse {
  const spans: IHumanFaceSkinChartMetricSpan[] = [];
  let totalLengthMetres = 0;
  for (const span of native) {
    const start = [...span.start],
      end = [...span.end];
    const lengthMetres = Math.hypot(
      ...end.map((value, axis) => value - start[axis]),
    );
    if (lengthMetres === 0) continue;
    const next = totalLengthMetres + lengthMetres;
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
    read: (point) =>
      readHumanFaceProjectedSkinCourse(spans, totalLengthMetres, point),
    frameAt: (distance) => {
      if (
        !Number.isFinite(distance) ||
        distance < 0 ||
        distance > totalLengthMetres ||
        spans.length === 0
      )
        throw new Error(
          "A native course frame needs a distance within a nonzero physical course.",
        );
      const span = spans.find(
        (piece) => distance <= piece.precedingLengthMetres + piece.lengthMetres,
      )!;
      const end = span.precedingLengthMetres + span.lengthMetres;
      const fraction =
        distance === span.precedingLengthMetres
          ? 0
          : distance === end
            ? 1
            : (distance - span.precedingLengthMetres) / span.lengthMetres;
      return span.frameAt(fraction);
    },
  };
}

import type { V3 } from "../geometry/V3.ts";
import { centroid2 } from "../geometry/centroid2.ts";
import { dist } from "../geometry/dist.ts";
import type { Course } from "../schema/Course.ts";
import type { CourseStation } from "../schema/CourseStation.ts";
import type { LoopRecord } from "../schema/LoopRecord.ts";
import type { Section } from "../schema/Section.ts";

/**
 * Records cropped midsagittal arcs as source-supported longitudinal guide observations.
 * The guide's section stations are actual coincident plane intersections; a missing
 * station stays absent and does not create a bridge between separate source pieces.
 *
 * @evidence contracts/common.md#principled-implementation Uses the exact source-cut pieces and their shared points with horizontal profiles. A 1e-4 mm proximity tolerance reconciles floating-point plane intersections; it cannot certify an anatomical midline or a smooth fitted guide.
 * @evidence contracts/common.md#clear-and-simple-design Each retained midsagittal arc becomes one guide, keeping source pieces distinct and avoiding heuristic anatomical names or feature-track switches.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No raw mesh indices, in-air chords, source genital landmarks or manually placed control points enter the guide.
 * @evidence contracts/common.md#meaningful-documentation States that these are source observations, how stations are matched and why disconnected pieces remain separate.
 * @evidence contracts/performance.md#efficient-algorithms For p guide segments and q horizontal profile points the conservative station match is O(p*q), with O(q) temporary candidate storage. This reference-only matching is not a product-frame operation.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses source cut pieces and existing horizontal profiles rather than recutting skin or constructing a nearest-triangle index.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns owned guide records; station candidates are call-local and no cache, filesystem handle or asynchronous job survives.
 */
export function trunkGuides(midline: Section, horizontal: Section[]): Course[] {
  return midline.loops.map((loop: LoopRecord, index: number): Course => {
    const points: V3[] =
      loop.closed && loop.points.length
        ? loop.points.concat([loop.points[0]])
        : loop.points;
    const stations: CourseStation[] = [];
    for (const section of horizontal) {
      const y: number | undefined = section.station.mm;
      if (y === undefined || !Number.isFinite(y))
        throw new Error(
          "Trunk guide matching requires a declared physical station in millimetres",
        );
      for (let k: number = 1; k < points.length; k++) {
        const a: V3 = points[k - 1];
        const b: V3 = points[k];
        if (a[1] > y === b[1] > y || a[1] === b[1]) continue;
        const t: number = (y - a[1]) / (b[1] - a[1]);
        const point: V3 = a.map(
          (value: number, axis: number): number =>
            value + t * (b[axis] - value),
        ) as V3;
        let supported: boolean = false;
        let phaseDeg: number = 0;
        for (const profile of section.loops) {
          if (profile.role !== "selected" && profile.role !== "clipped-arc")
            continue;
          const segments: number =
            profile.points.length - (profile.closed ? 0 : 1);
          for (let j: number = 0; j < segments; j++) {
            const c: V3 = profile.points[j];
            const d: V3 = profile.points[(j + 1) % profile.points.length];
            const denominator: number = d.reduce(
              (sum: number, value: number, axis: number): number =>
                sum + (value - c[axis]) ** 2,
              0,
            );
            const parameter: number = denominator
              ? Math.max(
                  0,
                  Math.min(
                    1,
                    point.reduce(
                      (sum: number, value: number, axis: number): number =>
                        sum + (value - c[axis]) * (d[axis] - c[axis]),
                      0,
                    ) / denominator,
                  ),
                )
              : 0;
            const nearest: V3 = c.map(
              (value: number, axis: number): number =>
                value + parameter * (d[axis] - value),
            ) as V3;
            if (dist(point, nearest) <= 1e-4) {
              supported = true;
              phaseDeg = point[2] >= -centroid2(profile.uv)[1] ? 0 : 180;
              break;
            }
          }
          if (supported) break;
        }
        if (supported)
          stations.push({ section: section.id, p: point, phaseDeg });
      }
    }
    return {
      id: `trunk.guide.midsagittal.${index}`,
      name: `midsagittal source arc ${index}`,
      kind: "midline",
      pose: "native-A",
      family: "trunk.longitudinal.midsagittal",
      method:
        "exact x=0 source-plane arc, clipped on source-face segments at both height boundaries; horizontal stations admitted only where the original profile supports the intersection; an intact closed source loop repeats its endpoint to retain its closing segment in the course polyline",
      confidence: "high",
      confidenceBasis:
        "geometric source intersections only; anatomical naming and curve smoothness unasserted",
      stations,
      pieces: [points],
    };
  });
}

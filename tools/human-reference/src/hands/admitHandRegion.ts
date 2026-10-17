import type { V2 } from "../geometry/V2.ts";
import type { V3 } from "../geometry/V3.ts";
import type { Course } from "../schema/Course.ts";
import type { CourseStation } from "../schema/CourseStation.ts";
import type { Event } from "../schema/Event.ts";
import type { FeatureLoop } from "../schema/FeatureLoop.ts";
import type { Landmark } from "../schema/Landmark.ts";
import type { LoopRecord } from "../schema/LoopRecord.ts";
import type { RegionFile } from "../schema/RegionFile.ts";
import type { Section } from "../schema/Section.ts";
import type { Silhouette } from "../schema/Silhouette.ts";
import { finiteHandPoint } from "./finiteHandPoint.ts";

/**
 * Separates inherited observations with invalid numeric geometry from usable input.
 * Every rejected record is retained by identity and cause in the revision report;
 * rejecting a record does not recover the anatomical feature it described.
 *
 * @evidence contracts/common.md#principled-implementation Admits source coordinate arrays without numeric coercion and removes dependent courses or landmarks that reference a rejected section.
 * @evidence contracts/common.md#clear-and-simple-design One inherited-region boundary owns serialized-nonfinite admission before fitting or source-surface arithmetic can consume it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not replace null coordinates with zero, join surviving fragments or silently claim rejected coverage was restored.
 * @evidence contracts/common.md#meaningful-documentation Defines the rejection report and explicitly distinguishes admission from anatomical recovery.
 * @evidence contracts/performance.md#efficient-algorithms Scans inherited coordinate arrays once and uses a set for rejected-section membership, taking O(p+r) time for p points and r records.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses parsed observation arrays in a cloned region; no source mesh reload or geometric distance query is needed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains only the admitted region and rejection metadata; transient section membership is bounded by the inherited section count.
 */
export function admitHandRegion(base: RegionFile): {
  region: RegionFile;
  rejected: { kind: string; id: string; reason: string }[];
} {
  const region: RegionFile = structuredClone(base);
  const rejected: { kind: string; id: string; reason: string }[] = [];
  const invalidSections: Set<string> = new Set();
  region.sections = region.sections.filter((section: Section): boolean => {
    const valid: boolean =
      [
        section.plane.origin,
        section.plane.normal,
        section.plane.u,
        section.plane.v,
      ].every((point: V3): boolean => finiteHandPoint(point, 3)) &&
      section.loops.every(
        (loop: LoopRecord): boolean =>
          loop.points.every((point: V3): boolean =>
            finiteHandPoint(point, 3),
          ) && loop.uv.every((point: V2): boolean => finiteHandPoint(point, 2)),
      );
    if (!valid) {
      invalidSections.add(section.id);
      rejected.push({
        kind: "section",
        id: section.id,
        reason: "nonfinite or serialized-null coordinate/plane",
      });
    }
    return valid;
  });
  region.courses = region.courses.filter((course: Course): boolean => {
    const valid: boolean =
      course.stations.every(
        (station: CourseStation): boolean =>
          finiteHandPoint(station.p, 3) &&
          !invalidSections.has(station.section),
      ) &&
      course.pieces.every((piece: V3[]): boolean =>
        piece.every((point: V3): boolean => finiteHandPoint(point, 3)),
      );
    if (!valid)
      rejected.push({
        kind: "course",
        id: course.id,
        reason: "invalid coordinate or rejected section dependency",
      });
    return valid;
  });
  region.landmarks = region.landmarks.filter((landmark: Landmark): boolean => {
    const valid: boolean =
      finiteHandPoint(landmark.p, 3) &&
      (landmark.section === undefined ||
        !invalidSections.has(landmark.section));
    if (!valid)
      rejected.push({
        kind: "landmark",
        id: landmark.id,
        reason: "invalid coordinate or rejected section dependency",
      });
    return valid;
  });
  region.loops = region.loops.filter((loop: FeatureLoop): boolean => {
    const valid: boolean =
      loop.points.every((point: V3): boolean => finiteHandPoint(point, 3)) &&
      [loop.frame.origin, loop.frame.normal, loop.frame.u, loop.frame.v].every(
        (point: V3): boolean => finiteHandPoint(point, 3),
      );
    if (!valid)
      rejected.push({
        kind: "feature-loop",
        id: loop.id,
        reason: "invalid coordinate or frame",
      });
    return valid;
  });
  region.events = region.events.filter((event: Event): boolean => {
    const valid: boolean =
      Number.isFinite(event.stationMm) && Number.isFinite(event.fraction);
    if (!valid)
      rejected.push({
        kind: "event",
        id: event.id,
        reason:
          "nonfinite or serialized-null event location; transition remains unlocated",
      });
    return valid;
  });
  region.silhouettes = region.silhouettes.filter(
    (silhouette: Silhouette): boolean => {
      const valid: boolean = silhouette.contours.every(
        (contour: Silhouette["contours"][number]): boolean =>
          contour.rim3d.every((point: V3): boolean =>
            finiteHandPoint(point, 3),
          ) &&
          contour.points2d.every((point: V2): boolean =>
            finiteHandPoint(point, 2),
          ),
      );
      if (!valid)
        rejected.push({
          kind: "silhouette",
          id: silhouette.id,
          reason: "invalid rim or projection coordinate",
        });
      return valid;
    },
  );
  region.measures = region.measures?.filter(
    (measure: NonNullable<RegionFile["measures"]>[number]): boolean => {
      const valid: boolean = Number.isFinite(measure.value);
      if (!valid)
        rejected.push({
          kind: "measure",
          id: measure.id,
          reason: "nonfinite or serialized-null measurement",
        });
      return valid;
    },
  );
  return { region, rejected };
}

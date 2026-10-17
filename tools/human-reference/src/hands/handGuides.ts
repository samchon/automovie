import type { Skin } from "../geometry/Skin.ts";
import type { SurfaceIndex } from "../geometry/SurfaceIndex.ts";
import { dist } from "../geometry/dist.ts";
import type { Course } from "../schema/Course.ts";
import type { CourseStation } from "../schema/CourseStation.ts";
import type { LoopRecord } from "../schema/LoopRecord.ts";
import type { Section } from "../schema/Section.ts";
import { joinCourse } from "../schema/joinCourse.ts";
import type { HandLoop } from "./HandLoop.ts";
import type { HandPin } from "./HandPin.ts";

/**
 * Connects measured cardinal pins through source-surface planar arcs.
 * A discontinuity larger than five millimetres remains an explicit gap; that
 * numerical continuity threshold is not an anatomical measurement.
 *
 * @evidence contracts/common.md#principled-implementation Reuses actual ray intersections and source-surface joins rather than interpolating unsupported straight chords.
 * @evidence contracts/common.md#clear-and-simple-design Produces four optional courses from the same section and pin definitions consumed by fitting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves missing pins and failed or excessive joins as gaps rather than inventing source curves.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes a geometric guide from an anatomical border and identifies the continuity threshold's numerical purpose.
 * @evidence contracts/performance.md#efficient-algorithms Four station scans cost O(s); source-surface joins additionally scan the source as documented by joinCourse.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the skin, spatial index and section pins already produced by the owning operation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns at most four course records and their surface paths; no external handles or persistent caches are acquired.
 */
export function handGuides(
  skin: Skin,
  index: SurfaceIndex,
  sections: Section[],
  family: string,
): Course[] {
  const out: Course[] = [];
  for (const semantic of ["dorsal", "radial", "palmar", "ulnar"]) {
    const stations: CourseStation[] = [];
    for (const section of sections) {
      const selected: HandLoop | undefined = section.loops.find(
        (loop: LoopRecord): boolean => loop.role === "selected",
      );
      const pin: HandPin | undefined = selected?.featurePins?.find(
        (value: HandPin): boolean => value.semantic === semantic,
      );
      if (pin)
        stations.push({
          section: section.id,
          p: pin.p,
          phaseDeg: pin.phaseDeg,
        });
    }
    if (!stations.length) continue;
    const linked: ReturnType<typeof joinCourse> = joinCourse(
      skin,
      index,
      stations,
      3,
      (i: number): string | null =>
        dist(stations[i - 1].p, stations[i].p) > 5
          ? "branch or phase discontinuity exceeds 5 mm; no chord inserted"
          : null,
    );
    out.push({
      id: `${family}.guide.${semantic}`,
      name: `${semantic} local-frame section intersection guide`,
      kind: "fixed-phase",
      pose: "native-A",
      family,
      method:
        "first cardinal ray crossing from the rig axis, joined by actual triangle-plane surface arcs; featurePins carry observed contour arclength correspondence",
      confidence: "medium",
      confidenceBasis:
        "geometric cardinal rays; anatomical assignment uses reference rig markers rather than palpation",
      stations,
      ...linked,
    });
  }
  return out;
}

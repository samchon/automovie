import type { Skin } from "../geometry/Skin.ts";
import type { SurfaceIndex } from "../geometry/SurfaceIndex.ts";
import type { V3 } from "../geometry/V3.ts";
import type { CourseStation } from "./CourseStation.ts";
import { surfacePath } from "./surfacePath.ts";

/**
 * Connects station observations through source-plane arcs, recording failures as separate pieces.
 *
 * @evidence contracts/common.md#principled-implementation Delegates each admissible station pair to the source-cut arc operator and starts a new piece at every declared or observed failure.
 * @evidence contracts/common.md#clear-and-simple-design Owns course continuity bookkeeping; station selection and surface-plane geometry remain separately owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed joins stay gaps and never become straight chords; no anatomical identity is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States that the course connects observed stations and explicitly retains disconnected pieces.
 * @evidence contracts/performance.md#efficient-algorithms Performs at most one surfacePath call per adjacent station pair and appends its returned points; dominant costs scale with station count, source triangles and resulting cut points.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the caller's nearest-surface index across pairs without caching geometrically distinct source cuts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary arrays and completed pieces belong to this call and its return value; no handle or module state persists.
 */
export function joinCourse(
  skin: Skin,
  index: SurfaceIndex,
  stations: CourseStation[],
  maxRatio: number = 3,
  breakBefore?: (i: number) => string | null,
): { pieces: V3[][]; gaps: { from: string; to: string; reason: string }[] } {
  const gaps: { from: string; to: string; reason: string }[] = [];
  const pieces: V3[][] = [];
  let current: V3[] = [];
  for (let i: number = 0; i < stations.length; i++) {
    if (i === 0) {
      current.push(stations[0].p);
      continue;
    }
    const reason: string | null = breakBefore ? breakBefore(i) : null;
    const path: V3[] | null = reason
      ? null
      : surfacePath(skin, index, stations[i - 1].p, stations[i].p, {
          maxRatio,
        });
    if (!path) {
      gaps.push({
        from: stations[i - 1].section,
        to: stations[i].section,
        reason:
          reason ??
          "no single planar source arc within the declared length ratio",
      });
      pieces.push(current);
      current = [stations[i].p];
      continue;
    }
    current.push(...path.slice(1));
  }
  if (current.length) pieces.push(current);
  return { pieces, gaps };
}

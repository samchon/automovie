import type { LoopRecord } from "../schema/LoopRecord.ts";
import type { Section } from "../schema/Section.ts";
import type { LimbDimension } from "./LimbDimension.ts";

/**
 * Reads dimensions from the selected closed source contour in its declared plane.
 * Merged, absent and open observations have no isolated tube dimensions.
 *
 * @evidence contracts/common.md#principled-implementation Bounds, skin perimeter and area come from the same selected intersection; the bound centre is an offset from the section origin, not an assumed bone or soft-tissue centre.
 * @evidence contracts/common.md#clear-and-simple-design One section produces one dimension record; no fitting model or population estimate is introduced.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not replace unavailable isolated sections with neighbouring dimensions or clinical values.
 * @evidence contracts/common.md#meaningful-documentation Defines closure, isolation, the bound centre and the independent measurements returned.
 * @evidence contracts/performance.md#efficient-algorithms Scans the selected contour once, taking O(n) time for n contour points and constant working space.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the source contour's stored breadth, depth, perimeter and signed area rather than recutting the mesh.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains only one returned record; no source, cache or external handle is acquired.
 */
export function limbSectionDimension(section: Section): LimbDimension | null {
  const loop: LoopRecord | undefined = section.loops.find(
    (item: LoopRecord): boolean => item.role === "selected" && item.closed,
  );
  if (
    section.status !== "closed" ||
    !loop ||
    section.station.mm === undefined ||
    loop.area === null
  )
    return null;
  const bounds: [number, number, number, number] = [
    Infinity,
    -Infinity,
    Infinity,
    -Infinity,
  ];
  for (const uv of loop.uv) {
    bounds[0] = Math.min(bounds[0], uv[0]);
    bounds[1] = Math.max(bounds[1], uv[0]);
    bounds[2] = Math.min(bounds[2], uv[1]);
    bounds[3] = Math.max(bounds[3], uv[1]);
  }
  return {
    section: section.id,
    axisMm: section.station.mm,
    breadthMm: loop.breadthU,
    depthMm: loop.depthV,
    skinPerimeterMm: loop.perimeter,
    areaMm2: loop.area,
    originOffsetUV: [(bounds[0] + bounds[1]) / 2, (bounds[2] + bounds[3]) / 2],
  };
}

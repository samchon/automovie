import { validateProductionDesignTurn } from "./validateProductionDesignTurn";
import { validateProductionDesignSegmentsIntersect } from "./validateProductionDesignSegmentsIntersect";

/**
 * Reject nonfinite or repeated XZ vertices, negligible signed area, reverse collinear bends and nonadjacent segment intersections.
 *
 * @evidence contracts/common.md#principled-implementation Exact coordinate keys reject repeated vertices, the shoelace sum requires nonnegligible represented area, adjacent determinants/dot products reject reversals and every nonadjacent edge pair must not intersect. World surface callers supply XZ coordinates; either winding and nonconvex simple polygons are allowed. Fixed 1e-9 arithmetic policies are not scale-independent exact predicates.
 * @evidence contracts/common.md#clear-and-simple-design One boolean surface-polygon gate composes shared orientation and segment arithmetic; the world owner supplies metre limits and emits the attributed diagnostic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation States minimum vertex count, distinct finite coordinates, area/bend/intersection refusals and numeric limitations; true is declaration admission rather than realized-mesh validity, and points remain borrowed and unchanged.
 * @evidence contracts/performance.md#efficient-algorithms For P vertices, area and bend passes are O(P), distinct-coordinate keys use O(P) storage and nonadjacent edge pairs cost O(P squared).
 * @evidence contracts/performance.md#reuse-equivalent-work Each current vertex population supplies all area, bend and edge-pair passes; the orientation/segment implementations are shared without caching mutable polygon verdicts.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Coordinate-key arrays and their Set are call-local and input-sized; only a boolean escapes, without retaining points, diagnostics, a handle or task.
 */
export const validateProductionDesignPolygon: (polygon: ReadonlyArray<{ x: number; z: number; }>) => boolean = (
  polygon: ReadonlyArray<{ x: number; z: number }>,
): boolean => {
  if (
    polygon.length < 3 ||
    polygon.some(
      (point: { x: number; z: number; }): boolean =>
        Number.isFinite(point.x) === false ||
        Number.isFinite(point.z) === false,
    ) ||
    new Set(polygon.map((point: { x: number; z: number; }): string => `${point.x}\0${point.z}`)).size !==
      polygon.length
  )
    return false;
  let twiceArea: number = 0;
  for (let index: number = 0; index < polygon.length; ++index) {
    const current: { x: number; z: number; } = polygon[index]!;
    const next: { x: number; z: number; } = polygon[(index + 1) % polygon.length]!;
    twiceArea += current.x * next.z - next.x * current.z;
  }
  if (Number.isFinite(twiceArea) === false || Math.abs(twiceArea) <= 1e-9)
    return false;
  for (let index: number = 0; index < polygon.length; ++index) {
    const previous: { x: number; z: number; } = polygon[(index + polygon.length - 1) % polygon.length]!;
    const current: { x: number; z: number; } = polygon[index]!;
    const next: { x: number; z: number; } = polygon[(index + 1) % polygon.length]!;
    const bend: number = validateProductionDesignTurn(previous, current, next);
    const reverseDot: number =
      (previous.x - current.x) * (next.x - current.x) +
      (previous.z - current.z) * (next.z - current.z);
    if (
      Number.isFinite(bend) === false ||
      Number.isFinite(reverseDot) === false ||
      (Math.abs(bend) <= 1e-9 && reverseDot > 0)
    )
      return false;
  }
  for (let left: number = 0; left < polygon.length; ++left) {
    const leftNext: number = (left + 1) % polygon.length;
    for (let right: number = left + 1; right < polygon.length; ++right) {
      const rightNext: number = (right + 1) % polygon.length;
      if (left === right || leftNext === right || rightNext === left) continue;
      if (
        validateProductionDesignSegmentsIntersect(
          polygon[left]!,
          polygon[leftNext]!,
          polygon[right]!,
          polygon[rightNext]!,
        )
      )
        return false;
    }
  }
  return true;
};

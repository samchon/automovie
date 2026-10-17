import type { Plane } from "../geometry/Plane.ts";
import type { Polyline } from "../geometry/Polyline.ts";
import type { V3 } from "../geometry/V3.ts";
import { cut } from "../geometry/cut.ts";
import { planeFrame } from "../geometry/planeFrame.ts";
import type { HeadContext } from "../headneck/HeadContext.ts";
import type { Family } from "../schema/Family.ts";
import type { LoopRecord } from "../schema/LoopRecord.ts";
import type { Section } from "../schema/Section.ts";
import { orientLoop } from "../schema/orientLoop.ts";

/**
 * Measures three world-axis section families through a declared ear support.
 * Support above 0.05 establishes broad bounds; triangles touching influence
 * above 0.01 preserve their complete source intersections within those bounds.
 * These diagnostic weight thresholds do not identify anatomical insertion.
 *
 * @evidence contracts/common.md#principled-implementation Exact source plane intersections retain every scoped loop and open arc; station count follows the requested physical spacing independently on all three axes.
 * @evidence contracts/common.md#clear-and-simple-design The family owns its station planes and broad support bounds, and returns both to its contour and course consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Weight thresholds declare one conservative observation protocol for every admitted source, not anatomy or expected answers.
 * @evidence contracts/common.md#meaningful-documentation The contract distinguishes rig support, source scope cuts, physical stations and anatomical insertion.
 * @evidence contracts/performance.md#efficient-algorithms Bounding takes O(V); K exact cuts cost O(K(V+T)) and retain their observed intersections, because all source fragments at every requested plane are required.
 * @evidence contracts/performance.md#reuse-equivalent-work One support bound and one triangle membership set serve all three families; no cross-source cache can reuse stale weight scope.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The invocation owns its triangle set and returned observations; retained output grows with the admitted source and station count and is transferred to the caller.
 */
export function earSectionFamily(
  context: HeadContext,
  influence: Float64Array,
  region: string,
  spacingMm: number,
): {
  families: Family[];
  sections: Section[];
  bounds: { lo: V3; hi: V3; centre: V3 };
} {
  if (
    !(spacingMm > 0) ||
    !Number.isFinite(spacingMm) ||
    influence.length !== context.s.vertices.length
  )
    throw new Error(
      "Ear section spacing and source influence must match the admitted skin",
    );
  const lo: V3 = [Infinity, Infinity, Infinity];
  const hi: V3 = [-Infinity, -Infinity, -Infinity];
  for (let i: number = 0; i < influence.length; i++)
    if (influence[i] > 0.05)
      for (let axis: number = 0; axis < 3; axis++) {
        lo[axis] = Math.min(lo[axis], context.s.vertices[i][axis]);
        hi[axis] = Math.max(hi[axis], context.s.vertices[i][axis]);
      }
  if (lo.some((value: number): boolean => !Number.isFinite(value)))
    throw new Error("The declared ear support has no source vertices");
  const centre: V3 = [
    (lo[0] + hi[0]) / 2,
    (lo[1] + hi[1]) / 2,
    (lo[2] + hi[2]) / 2,
  ];
  const scopedTriangles: Set<number> = new Set();
  context.s.triangles.forEach(
    (triangle: [number, number, number], i: number): void => {
      if (triangle.some((vertex: number): boolean => influence[vertex] > 0.01))
        scopedTriangles.add(i);
    },
  );
  const families: Family[] = [];
  const sections: Section[] = [];
  for (let axis: number = 0; axis < 3; axis++) {
    const id: string = `${region}.${["sag", "level", "cor"][axis]}-dense`;
    const normal: V3 = [0, 0, 0];
    normal[axis] = 1;
    const reference: V3 = axis === 2 ? [0, 1, 0] : [0, 0, -1];
    families.push({
      id,
      kind: ["sagittal", "level", "coronal"][axis],
      axis: `world ${["X", "Y", "Z"][axis]}`,
      fraction0: `support minimum ${lo[axis]} mm`,
      fraction1: `support maximum ${hi[axis]} mm`,
      reference: `v is projected ${reference.join(",")}; u = v cross normal`,
      phaseLabels: {},
    });
    const intervals: number = Math.ceil((hi[axis] - lo[axis]) / spacingMm);
    if (!Number.isSafeInteger(intervals) || intervals > 100000)
      throw new Error(
        "Ear section family exceeds its declared 100000-plane allocation budget",
      );
    for (let k: number = 1; k < intervals; k++) {
      const fraction: number = k / intervals;
      const mm: number = lo[axis] + fraction * (hi[axis] - lo[axis]);
      const origin: V3 = [...centre];
      origin[axis] = mm;
      const plane: Plane = planeFrame(origin, normal, reference);
      const polylines: Polyline[] = cut(
        context.s,
        plane,
        (index: number): boolean => scopedTriangles.has(index),
      );
      const loops: LoopRecord[] = polylines
        .filter((polyline: Polyline): boolean => polyline.pts.length >= 2)
        .map(
          (polyline: Polyline): LoopRecord =>
            orientLoop(
              plane,
              polyline,
              polyline.closed ? "selected" : "clipped-arc",
            ),
        );
      sections.push({
        id: `${id}.${String(k).padStart(4, "0")}`,
        family: id,
        station: {
          fraction,
          mm,
          definition: `equal physical spacing at most ${spacingMm} mm between declared support extents`,
        },
        pose: "native-A",
        plane: { origin, normal: plane.n, u: plane.u, v: plane.v },
        status: loops.some((loop: LoopRecord): boolean => loop.closed)
          ? "closed"
          : loops.length
            ? "clipped"
            : "absent",
        statusNote:
          "All scoped source intersections are retained. Open endpoints are diagnostic support cuts, not anatomical free edges.",
        loops,
      });
    }
  }
  return { families, sections, bounds: { lo, hi, centre } };
}

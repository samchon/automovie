import type { CutPoint } from "../geometry/CutPoint.ts";
import type { Plane } from "../geometry/Plane.ts";
import type { Polyline } from "../geometry/Polyline.ts";
import type { Skin } from "../geometry/Skin.ts";
import type { V3 } from "../geometry/V3.ts";
import { cut } from "../geometry/cut.ts";
import { dot } from "../geometry/dot.ts";
import { mul } from "../geometry/mul.ts";
import { planeFrame } from "../geometry/planeFrame.ts";
import type { Family } from "../schema/Family.ts";
import type { LoopRecord } from "../schema/LoopRecord.ts";
import type { Section } from "../schema/Section.ts";
import { orientLoop } from "../schema/orientLoop.ts";
import { clipSurfaceSegments } from "./clipSurfaceSegments.ts";
import { trunkArmShare } from "./trunkArmShare.ts";

/**
 * Reserves sagittal, coronal and two diagonal vertical source-cut families.
 * Offsets span source-derived trunk support, while every segment is cropped at
 * the declared heights and diagnostic arm-weight scope without closing an interior cap.
 * These planes are observations for comparison, never fitting inputs or anatomical borders.
 *
 * @evidence contracts/common.md#principled-implementation Independent vertical planes expose depth and oblique regressions hidden by horizontal aggregates. Original face-segment clipping preserves surface containment; a finite plane set does not bound unobserved surface error.
 * @evidence contracts/common.md#clear-and-simple-design Owns only validation-plane placement and raw observations; the support comes from admitted training contours and the caller owns exclusion from fitting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The four plane directions are disclosed observer conventions and intervals are explicit sampling input. No local source coordinates, source indices or inferred attachment loops are embedded.
 * @evidence contracts/common.md#meaningful-documentation States units, support dependence, scope partition, reservation and the absence of a complete error bound.
 * @evidence contracts/performance.md#efficient-algorithms For m planes, v source vertices and t source triangles, cutting costs O(m*(v+t)); retained closed contours additionally require their convex-hull sorts. Output storage follows cut-point count and no nearest-triangle search is performed.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses one combined skin and training support across all four direction families; their distinct planes require separate source intersections.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary contours are local to each plane and only returned observations persist; no file handles, cache entries or asynchronous jobs are created.
 */
export function trunkValidationSections(
  skin: Skin,
  lowerHeightMm: number,
  upperHeightMm: number,
  support: V3[],
  intervals: number,
): { families: Family[]; sections: Section[] } {
  if (
    skin.pose !== "native-A" ||
    !support.length ||
    !Number.isSafeInteger(intervals) ||
    intervals < 2
  )
    throw new Error(
      "Native trunk validation requires support and at least two sampling intervals",
    );
  const definitions: { name: string; normal: V3 }[] = [
    { name: "sagittal", normal: [1, 0, 0] },
    { name: "coronal", normal: [0, 0, 1] },
    { name: "oblique45", normal: [Math.SQRT1_2, 0, Math.SQRT1_2] },
    { name: "oblique135", normal: [-Math.SQRT1_2, 0, Math.SQRT1_2] },
  ];
  const families: Family[] = [];
  const sections: Section[] = [];
  for (const definition of definitions) {
    const family: string = `trunk.validation.${definition.name}`;
    let low: number = Infinity;
    let high: number = -Infinity;
    for (const point of support) {
      const offset: number = dot(point, definition.normal);
      low = Math.min(low, offset);
      high = Math.max(high, offset);
    }
    families.push({
      id: family,
      kind: definition.name,
      axis: `native vertical plane normal ${definition.normal.join(",")}; validation only`,
      fraction0: `support minimum ${low} mm`,
      fraction1: `support maximum ${high} mm`,
      reference: "world +Y",
      phaseLabels: { "0": "inferior", "180": "superior" },
    });
    for (let k: number = 1; k < intervals; k++) {
      const fraction: number = k / intervals;
      const offset: number = low + fraction * (high - low);
      const plane: Plane = planeFrame(
        mul(definition.normal, offset),
        definition.normal,
        [0, 1, 0],
      );
      const loops: LoopRecord[] = [];
      for (const polyline of cut(skin, plane) as Polyline[]) {
        const points: V3[] = polyline.pts.map((point: CutPoint): V3 => point.p);
        const channels: number[][] = [
          points.map((point: V3): number => point[1] - lowerHeightMm),
          points.map((point: V3): number => upperHeightMm - point[1]),
          polyline.pts.map(
            (point: CutPoint): number => 0.5 - trunkArmShare(skin, point, "l"),
          ),
          polyline.pts.map(
            (point: CutPoint): number => 0.5 - trunkArmShare(skin, point, "r"),
          ),
        ];
        for (const piece of clipSurfaceSegments(
          points,
          polyline.closed,
          channels,
        ))
          loops.push(
            orientLoop(
              plane,
              {
                closed: piece.closed,
                pts: piece.points.map((p: V3): { p: V3 } => ({ p })),
              },
              piece.closed ? "selected" : "clipped-arc",
            ),
          );
      }
      sections.push({
        id: `${family}.${k}`,
        family,
        station: {
          fraction,
          mm: offset,
          definition: "validation-only offset along the family's unit normal",
        },
        pose: "native-A",
        plane: {
          origin: plane.origin,
          normal: plane.n,
          u: plane.u,
          v: plane.v,
        },
        status: loops.length
          ? loops.every((loop: LoopRecord): boolean => loop.closed)
            ? "closed"
            : "clipped"
          : "absent",
        statusNote:
          "Excluded from fitting; cropped at declared height and linear arm-weight scope. Scope endpoints are not skin boundaries.",
        loops,
      });
    }
  }
  return { families, sections };
}

import type { CutPoint } from "../geometry/CutPoint.ts";
import type { Plane } from "../geometry/Plane.ts";
import type { Skin } from "../geometry/Skin.ts";
import type { V3 } from "../geometry/V3.ts";
import { cut } from "../geometry/cut.ts";
import { planeFrame } from "../geometry/planeFrame.ts";
import type { LoopRecord } from "../schema/LoopRecord.ts";
import type { Section } from "../schema/Section.ts";
import { orientLoop } from "../schema/orientLoop.ts";
import { clipSurfaceSegments } from "./clipSurfaceSegments.ts";

/**
 * Observes the exact midsagittal skin cut within the declared trunk interval.
 * Both crop levels are applied to each original source-face segment; disconnected
 * skin remains in separate open arcs rather than a line through the person.
 *
 * @evidence contracts/common.md#principled-implementation Cuts the native surface by x=0 and intersects each cut segment's parameter interval with the two height inequalities. It makes no symmetry, clinical midline or source genital landmark claim.
 * @evidence contracts/common.md#clear-and-simple-design One section retains all cropped midsagittal components; a consumer can select supported guide arcs without reconstructing or guessing their provenance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No lowest-source-point shortcut, fabricated source-edge identifier or chord closing a cropped arc is used.
 * @evidence contracts/common.md#meaningful-documentation States source-face containment, two-sided crop, disconnected pieces and the geometric meaning of x=0.
 * @evidence contracts/performance.md#efficient-algorithms One source plane cut costs O(v+t) for source vertices and triangles. Cropping costs O(p); any intact closed contour also requires its O(p log p) convex hull during orientation. Output storage is O(p).
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the caller's combined skin and the same interval used by horizontal profiles; no source load or spatial index is repeated.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns the observed section only; temporary cuts are call-local and no retained cache, file or process is created.
 */
export function trunkMidlineSection(
  skin: Skin,
  lowerHeightMm: number,
  upperHeightMm: number,
): Section {
  if (skin.pose !== "native-A")
    throw new Error("Trunk midline observations require native source pose");
  const plane: Plane = planeFrame([0, lowerHeightMm, 0], [1, 0, 0], [0, 1, 0]);
  const loops: LoopRecord[] = [];
  for (const polyline of cut(skin, plane)) {
    const points: V3[] = polyline.pts.map((point: CutPoint): V3 => point.p);
    for (const piece of clipSurfaceSegments(points, polyline.closed, [
      points.map((point: V3): number => point[1] - lowerHeightMm),
      points.map((point: V3): number => upperHeightMm - point[1]),
    ]))
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
  return {
    id: "trunk.longitudinal.midsagittal.0",
    family: "trunk.longitudinal.midsagittal",
    station: {
      fraction: 0,
      mm: 0,
      definition: "world x=0, clipped to the declared lower and neck01 heights",
    },
    pose: "native-A",
    plane: { origin: plane.origin, normal: plane.n, u: plane.u, v: plane.v },
    status: loops.length
      ? loops.every((loop: LoopRecord): boolean => loop.closed)
        ? "closed"
        : "clipped"
      : "absent",
    loops,
    statusNote:
      "Geometric midsagittal source cut; all cropped components retained and open crop ends are scope boundaries. The frame does not assert bilateral symmetry.",
  };
}

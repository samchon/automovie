import type { CutPoint } from "../geometry/CutPoint.ts";
import type { Plane } from "../geometry/Plane.ts";
import type { Polyline } from "../geometry/Polyline.ts";
import type { Skin } from "../geometry/Skin.ts";
import type { V2 } from "../geometry/V2.ts";
import type { V3 } from "../geometry/V3.ts";
import { centroid2 } from "../geometry/centroid2.ts";
import { cut } from "../geometry/cut.ts";
import { planeFrame } from "../geometry/planeFrame.ts";
import { signedArea } from "../geometry/signedArea.ts";
import { to2 } from "../geometry/to2.ts";
import type { LoopRecord } from "../schema/LoopRecord.ts";
import type { Section } from "../schema/Section.ts";
import { orientLoop } from "../schema/orientLoop.ts";
import { clipSurfaceSegments } from "./clipSurfaceSegments.ts";
import { trunkArmShare } from "./trunkArmShare.ts";

/**
 * Observes one native horizontal trunk plane, retaining every source component.
 * The largest closed median-crossing loop is selected geometrically; arm-weight
 * scope marks merged sections and open crop arcs without claiming anatomical seams.
 *
 * @evidence contracts/common.md#principled-implementation Uses exact source-edge plane intersections and polygon area to select a median-crossing contour. Linear rig-weight crops retain original face segments. Median crossing can include source genital islands near the crop and is not a branch-event detector.
 * @evidence contracts/common.md#clear-and-simple-design Owns horizontal component selection and scope only; the caller supplies the physical station and its fitting or validation family.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No identity coordinates or artificial caps enter the observation. The 0.5 rig-share partition is a disclosed diagnostic convention, not a surface attachment.
 * @evidence contracts/common.md#meaningful-documentation States native pose, geometric selection, retained components and the unresolved lower-boundary limitation.
 * @evidence contracts/performance.md#efficient-algorithms One source plane cut costs O(v+t) for source vertices and triangles. Projection, selection and clipping are O(p), while closed-loop orientation includes O(p log p) convex-hull work. Retained contour storage is O(p).
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the combined skin and its precomputed group weights for every contour; no source file or spatial index is rebuilt here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one section and its raw loops; all temporary arrays are call-local and there are no external handles or caches.
 */
export function trunkSection(
  skin: Skin,
  yMm: number,
  fraction: number,
  family: string,
  id: string,
): Section {
  if (skin.pose !== "native-A")
    throw new Error("Trunk anatomy observations require native source pose");
  const plane: Plane = planeFrame([0, yMm, 0], [0, 1, 0], [0, 0, -1]);
  const polylines: Polyline[] = cut(skin, plane);
  let selected: Polyline | undefined;
  let largestArea: number = -Infinity;
  for (const polyline of polylines) {
    if (
      !polyline.closed ||
      !polyline.pts.some((point: CutPoint): boolean => point.p[0] < 0) ||
      !polyline.pts.some((point: CutPoint): boolean => point.p[0] > 0)
    )
      continue;
    const area: number = Math.abs(
      signedArea(
        polyline.pts.map((point: CutPoint): V2 => to2(plane, point.p)),
      ),
    );
    if (area > largestArea) {
      largestArea = area;
      selected = polyline;
    }
  }
  const loops: LoopRecord[] = [];
  let merged: boolean = false;
  for (const polyline of polylines) {
    const uv: V2[] = polyline.pts.map(
      (point: CutPoint): V2 => to2(plane, point.p),
    );
    const centre: V2 = centroid2(uv);
    loops.push(
      orientLoop(
        plane,
        polyline,
        polyline === selected ? "selected" : "other",
        polyline === selected ? [0, centre[1]] : undefined,
      ),
    );
    if (polyline !== selected) continue;
    const left: number[] = polyline.pts.map(
      (point: CutPoint): number => 0.5 - trunkArmShare(skin, point, "l"),
    );
    const right: number[] = polyline.pts.map(
      (point: CutPoint): number => 0.5 - trunkArmShare(skin, point, "r"),
    );
    merged =
      left.some((value: number): boolean => value < 0) ||
      right.some((value: number): boolean => value < 0);
    if (merged) {
      const arcs: { closed: boolean; points: V3[] }[] = clipSurfaceSegments(
        polyline.pts.map((point: CutPoint): V3 => point.p),
        polyline.closed,
        [left, right],
      );
      for (const arc of arcs)
        loops.push(
          orientLoop(
            plane,
            {
              closed: arc.closed,
              pts: arc.points.map((p: V3): { p: V3 } => ({ p })),
            },
            "clipped-arc",
          ),
        );
    }
  }
  return {
    id,
    family,
    station: {
      fraction,
      mm: yMm,
      definition:
        "absolute native-frame horizontal plane; family declares training or reserved status",
    },
    pose: "native-A",
    plane: { origin: plane.origin, normal: plane.n, u: plane.u, v: plane.v },
    status: selected ? (merged ? "merged" : "closed") : "absent",
    statusNote:
      "Largest closed median-crossing loop selected by area. Other components retained; arm merging and crop boundaries use rig share only. This does not qualify a thigh-branch event.",
    loops,
  };
}

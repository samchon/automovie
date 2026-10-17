import type { Plane } from "../geometry/Plane.ts";
import type { Polyline } from "../geometry/Polyline.ts";
import type { Skin } from "../geometry/Skin.ts";
import type { V2 } from "../geometry/V2.ts";
import type { V3 } from "../geometry/V3.ts";
import { contains } from "../geometry/contains.ts";
import { cut } from "../geometry/cut.ts";
import { dist } from "../geometry/dist.ts";
import { lerp } from "../geometry/lerp.ts";
import { norm } from "../geometry/norm.ts";
import { planeFrame } from "../geometry/planeFrame.ts";
import { signedArea } from "../geometry/signedArea.ts";
import { sub } from "../geometry/sub.ts";
import { to2 } from "../geometry/to2.ts";
import type { LoopRecord } from "../schema/LoopRecord.ts";
import type { Section } from "../schema/Section.ts";
import { orientLoop } from "../schema/orientLoop.ts";
import type { LimbSegment } from "./LimbSegment.ts";

/**
 * Intersects a native limb rig-normal plane with the fixed source skin.
 * The smallest closed contour containing its axis point is an isolated-tube candidate.
 * Distal width and midsagittal crossing flags preserve inherited branch diagnostics;
 * neither is a clinical bound or a proof of anatomical correspondence.
 *
 * @evidence contracts/common.md#principled-implementation Uses exact source-edge plane intersections in world millimetres and the source rig posture; chooses the smallest enclosing contour only where a simple limb tube exists. Ambiguous or merged regions remain explicitly unqualified.
 * @evidence contracts/common.md#clear-and-simple-design This operation owns one observation plane and contour; station grids, shared boundaries and surface fitting remain separate responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 1.6-times mid-segment width flag is an inherited diagnostic heuristic, explicitly reported rather than treated as anatomy or a consumer acceptance threshold.
 * @evidence contracts/common.md#meaningful-documentation Defines posture, units, contour selection and the limitations of branch flags; the result records the physical plane and method.
 * @evidence contracts/performance.md#efficient-algorithms Source cutting scans all vertices and triangles; containing loops are area-sorted. This preserves crossings with neighbouring parts needed to diagnose merges, rather than clipping by an assumed anatomical region.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller supplies one assembled skin reused across all stations; this function creates no duplicate source mesh or spatial cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary cut contours are released after each observation; only the selected output contour remains reachable through the returned section.
 */
export function limbSourceSection(
  skin: Skin,
  region: string,
  segment: LimbSegment,
  mm: number,
  heldOut: boolean,
  medianWidthMm: number,
): Section {
  const a: V3 = skin.bones.get(segment.proximal)!.pos;
  const b: V3 = skin.bones.get(segment.distal)!.pos;
  const fraction: number = mm / dist(a, b);
  const plane: Plane = planeFrame(
    lerp(a, b, fraction),
    norm(sub(b, a)),
    [0, 0, -1],
  );
  const candidates: { polyline: Polyline; uv: V2[] }[] = cut(skin, plane)
    .map((polyline: Polyline): { polyline: Polyline; uv: V2[] } => ({
      polyline,
      uv: polyline.pts.map(
        (point: Polyline["pts"][number]): V2 => to2(plane, point.p),
      ),
    }))
    .filter(
      (entry: { polyline: Polyline; uv: V2[] }): boolean =>
        entry.polyline.closed && contains(entry.uv, [0, 0]),
    );
  candidates.sort(
    (
      a: { polyline: Polyline; uv: V2[] },
      b: { polyline: Polyline; uv: V2[] },
    ): number => Math.abs(signedArea(a.uv)) - Math.abs(signedArea(b.uv)),
  );
  const selected: LoopRecord | null = candidates.length
    ? orientLoop(plane, candidates[0].polyline, "selected", [0, 0])
    : null;
  const mergedWithTrunk: boolean =
    !!selected &&
    selected.points.some((point: V3): boolean => point[0] < 0) &&
    selected.points.some((point: V3): boolean => point[0] > 0);
  const mergedDistally: boolean =
    !!selected &&
    fraction > 1 &&
    Math.max(selected.breadthU, selected.depthV) > 1.6 * medianWidthMm;
  const ambiguous: boolean = candidates.length > 1;
  const status: Section["status"] = !selected
    ? "absent"
    : mergedWithTrunk || mergedDistally || ambiguous
      ? "merged"
      : "closed";
  return {
    id: `${region}.${segment.key}.${heldOut ? "heldout" : "dense"}.${mm}`,
    family: `${region}.${segment.key}`,
    station: {
      fraction,
      mm,
      definition: `Native-A plane ${mm} mm from ${segment.proximal} along its rig line to ${segment.distal}; ${heldOut ? "excluded midpoint observation" : "training observation"}`,
    },
    pose: "native-A",
    plane: { origin: plane.origin, normal: plane.n, u: plane.u, v: plane.v },
    status,
    ...(status !== "closed"
      ? {
          statusNote: !selected
            ? "No closed source intersection contains the bone-axis point."
            : ambiguous
              ? "Multiple closed contours contain the rig-axis point; the smallest is retained only as a diagnostic observation."
              : mergedWithTrunk
                ? "Source contour crosses the world midsagittal plane; branch ownership retained."
                : "Distal width exceeds inherited 1.6-times mid-segment heuristic; not an anatomical bound.",
        }
      : {}),
    loops: selected ? [selected] : [],
  };
}

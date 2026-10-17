import type { Plane } from "../geometry/Plane.ts";
import type { Polyline } from "../geometry/Polyline.ts";
import type { Skin } from "../geometry/Skin.ts";
import type { V3 } from "../geometry/V3.ts";
import { contains } from "../geometry/contains.ts";
import { cut } from "../geometry/cut.ts";
import { dot } from "../geometry/dot.ts";
import { lerp } from "../geometry/lerp.ts";
import { sub } from "../geometry/sub.ts";
import { to2 } from "../geometry/to2.ts";
import type { Section } from "../schema/Section.ts";
import { orientLoop } from "../schema/orientLoop.ts";
import type { HandAxis } from "./HandAxis.ts";
import type { HandLoop } from "./HandLoop.ts";
import { handPins } from "./handPins.ts";

/**
 * Observes a physical plane without flattening the reference's native hand pose.
 * Selection uses the smallest closed contour containing the rig axis. A merged
 * label means another registered digit axis crosses that contour; the converse
 * does not establish full topological isolation or absence of self-contact.
 *
 * @evidence contracts/common.md#principled-implementation Uses exact source-edge plane cuts and preserves every closed component, then classifies measured axis crossings in the same plane.
 * @evidence contracts/common.md#clear-and-simple-design Keeps contour extraction, selection and its explicit limits together in one observation producer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An absent enclosing contour stays absent; open scope-boundary arcs are counted rather than artificially closed.
 * @evidence contracts/common.md#meaningful-documentation States the selection and merged-label premises, source posture and nonisolation limitation.
 * @evidence contracts/performance.md#efficient-algorithms Plane cutting scans the scoped source; classification scans each resulting contour and a fixed number of digit chain segments.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the caller's skin scope and registered chains for all stations, with no source reload.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Cut arrays are local to the call; only the returned contour observations remain reachable.
 */
export function observeHandSection(
  skin: Skin,
  id: string,
  family: string,
  mm: number,
  fraction: number,
  plane: Plane,
  radial: V3,
  definition: string,
  otherAxes: HandAxis[] = [],
): Section {
  const polylines: Polyline[] = cut(skin, plane);
  const loops: HandLoop[] = polylines
    .filter((p: Polyline): boolean => p.closed && p.pts.length >= 3)
    .map((p: Polyline): HandLoop => orientLoop(plane, p, "other", [0, 0]));
  const selected: HandLoop | undefined = loops
    .filter((loop: HandLoop): boolean => contains(loop.uv, [0, 0]))
    .sort(
      (a: HandLoop, b: HandLoop): number =>
        Math.abs(a.area ?? 0) - Math.abs(b.area ?? 0),
    )[0];
  if (selected) {
    selected.role = "selected";
    selected.featurePins = handPins(selected, radial, plane);
  }
  const merged: string[] = [];
  if (selected)
    for (const other of otherAxes) {
      for (let i: number = 0; i + 1 < other.chain.length; i++) {
        const a: V3 = other.chain[i];
        const b: V3 = other.chain[i + 1];
        const da: number = dot(sub(a, plane.origin), plane.n);
        const db: number = dot(sub(b, plane.origin), plane.n);
        let intersects: boolean = false;
        if (Math.abs(da) < 1e-9)
          intersects ||= contains(selected.uv, to2(plane, a));
        if (Math.abs(db) < 1e-9)
          intersects ||= contains(selected.uv, to2(plane, b));
        if (da < 0 !== db < 0)
          intersects ||= contains(
            selected.uv,
            to2(plane, lerp(a, b, da / (da - db))),
          );
        if (intersects) {
          merged.push(other.name);
          break;
        }
      }
    }
  const openCount: number = polylines.filter(
    (p: Polyline): boolean => !p.closed,
  ).length;
  return {
    id,
    family,
    station: { fraction, mm, definition },
    pose: "native-A",
    plane: { origin: plane.origin, normal: plane.n, u: plane.u, v: plane.v },
    status: selected
      ? merged.length
        ? "merged"
        : "closed"
      : openCount
        ? "open"
        : "absent",
    statusNote: `${selected ? "selected contour contains the local rig axis" : "local rig axis has no enclosing closed contour"}; ${merged.length ? `also contains axes ${merged.join(", ")}; not an isolated digit contour; ` : ""}${openCount} open scope-boundary arcs excluded; other closed components retained`,
    loops,
  };
}

import type { CutPoint } from "../geometry/CutPoint.ts";
import type { Plane } from "../geometry/Plane.ts";
import type { Polyline } from "../geometry/Polyline.ts";
import type { Skin } from "../geometry/Skin.ts";
import type { V3 } from "../geometry/V3.ts";
import { add } from "../geometry/add.ts";
import { cut } from "../geometry/cut.ts";
import { dot } from "../geometry/dot.ts";
import { mul } from "../geometry/mul.ts";
import { planeFrame } from "../geometry/planeFrame.ts";
import { critical } from "../observations/critical.ts";
import { sourceOrientation } from "../observations/sourceOrientation.ts";
import type { BranchDefinition } from "./BranchDefinition.ts";
import type { BranchObservation } from "./BranchObservation.ts";
import type { BranchSection } from "./BranchSection.ts";

/**
 * Observes incident source contours on both sides of local PL-height saddles.
 * Lower/upper links follow Bremer et al. (2004), II.C and III.A:
 * https://web.cs.ucdavis.edu/~hamann/BremerEdelsbrunnerHamannPascucci2004TVCG.pdf
 * No contour count threshold substitutes for the critical source topology.
 *
 * @evidence contracts/common.md#principled-implementation Uses the shared canonical source-link classifier, then cuts noncritical physical planes on either side and retains only contours incident to that critical source vertex. Equal-height neighbours and nonmanifold links remain explicit; source addresses are discarded before return.
 * @evidence contracts/common.md#clear-and-simple-design Owns critical-event observation independently of ordinary station sampling and anatomical naming. Count-preserving surgery remains represented by the full incident contours.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses no expected event coordinate or nearest remote-loop partner. Brackets too close to the cutting operator's 1e-9 mm classification tolerance remain unresolved.
 * @evidence contracts/common.md#meaningful-documentation States physical station units, link-classification source, incident-contour support and precision limitations instead of certifying a clinical junction.
 * @evidence contracts/performance.md#efficient-algorithms Sorts V unique source heights in O(V log V), classifies the mesh links once, and scans T triangles twice for each of E local saddles; output retains the incident source contour points. Full cuts are needed to preserve actual component connectivity.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the sorted source heights, normalized frame and loaded mesh through all event brackets. It owns no cross-call cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All link structures belong to the shared classifier call and all remaining arrays to this operation or its return value; it opens no resources and retains no global state.
 */
export function observeBranchEvents(
  skin: Skin,
  definition: BranchDefinition,
  orientation: (frame: Plane, polyline: Polyline) => number = sourceOrientation(
    skin,
  ),
): {
  sections: BranchSection[];
  events: BranchObservation["events"];
  limits: string[];
} {
  const axis: V3 = definition.frame.n;
  const offset: number = dot(definition.frame.origin, axis);
  const levels: number[] = [
    ...new Set(skin.vertices.map((point: V3): number => dot(point, axis))),
  ].sort((a: number, b: number): number => a - b);
  const sections: BranchSection[] = [];
  const events: BranchObservation["events"] = [];
  const limits: string[] = [];
  for (const event of critical(skin, axis)) {
    if (
      event.p.some(
        (coordinate: number, k: number): boolean =>
          coordinate < definition.bounds.low[k] ||
          coordinate > definition.bounds.high[k],
      )
    )
      continue;
    if (!event.manifold)
      limits.push(
        `Nonmanifold source link at physical point ${event.p.join(",")}; local surgery is not certified.`,
      );
    if (event.lower < 2 || event.upper < 2) continue;
    let low: number = 0;
    let high: number = levels.length;
    while (low < high) {
      const middle: number = (low + high) >>> 1;
      if (levels[middle] < event.level) low = middle + 1;
      else high = middle;
    }
    const epsilon: number = Math.min(
      0.01,
      (event.level - levels[low - 1]) / 4,
      (levels[low + 1] - event.level) / 4,
    );
    if (!(epsilon > 1e-8)) {
      limits.push(
        `Critical station ${event.level - offset} mm has no bracket safely above the source cutting tolerance.`,
      );
      continue;
    }
    const bracket: [number, number] = [
      event.level - epsilon - offset,
      event.level + epsilon - offset,
    ];
    const id: string = `${definition.name}.critical.${events.length}`;
    for (let side: number = 0; side < 2; side++) {
      const station: number = bracket[side];
      const frame: Plane = planeFrame(
        add(definition.frame.origin, mul(axis, station)),
        axis,
        definition.frame.v,
      );
      const incident: Polyline[] = cut(skin, frame).filter(
        (polyline: Polyline): boolean =>
          polyline.pts.some(
            (point: CutPoint): boolean =>
              point.a === event.vertex || point.b === event.vertex,
          ),
      );
      if (
        !incident.length ||
        incident.some((polyline: Polyline): boolean => !polyline.closed)
      )
        limits.push(
          `${id}: ${side === 0 ? "below" : "above"} incident contours are absent or open.`,
        );
      sections.push({
        id: `${id}.${side === 0 ? "below" : "above"}`,
        stationMm: station,
        frame,
        scope: "full-incident-contour",
        pieces: incident.map(
          (polyline: Polyline): BranchSection["pieces"][number] => ({
            closed: polyline.closed,
            points: polyline.pts.map((point: CutPoint): V3 => point.p),
            sourceClosed: polyline.closed,
            winding: polyline.closed ? orientation(frame, polyline) : null,
          }),
        ),
      });
    }
    events.push({
      id,
      point: event.p,
      stationMm: event.level - offset,
      bracketMm: bracket,
      lowerLinkComponents: event.lower,
      upperLinkComponents: event.upper,
      manifoldLink: event.manifold,
      equalHeightNeighbour: event.flat,
      below: `${id}.below`,
      above: `${id}.above`,
    });
  }
  return { sections, events, limits };
}

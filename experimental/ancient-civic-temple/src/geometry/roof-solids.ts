/**
 * Turns composed roof pieces into closed slab prisms with a normal thickness.
 * The top is the piece's original owner's upper surface, the sides are exposed end thickness, and the
 * underside is split by the planar region below (room, wall, exterior) into interior ceiling, support contact
 * face and exterior eave soffit. Interior sides where pieces touch hide inside the neighbouring slab. The
 * underside split is a face split on the same plane and does not change the slab shape.
 */
import type { IAutoMovieVector3 } from "@automovie/interface";
import { partitionPlan, planeHeight, simplifyPlan, type PlanPoint, type RoofPatch } from "./planar-domain";
import { levelPlane, prismFaces } from "./prism";
import type { WallFace } from "./wall-solids";

/** Underside classification regions, consumed in order; what remains is soffit. Surfaces are per roof owner. */
export interface UndersideRegion {
  polygon: PlanPoint[];
  surface: (owner: string) => string;
}

export const roofSlabFaces = (
  patches: readonly RoofPatch[],
  regions: readonly UndersideRegion[],
): WallFace[] => patches.flatMap((patch) => {
  const under = { ...patch.height, constant: patch.height.constant - patch.thickness };
  const faces: WallFace[] = [];
  for (const face of prismFaces(patch.polygon, under, patch.height)) {
    if (face.side === "top") faces.push({ surface: patch.surface, corners: face.corners });
    else if (face.side === "edge") faces.push({ surface: `surface.${patch.owner}.edge`, corners: face.corners });
  }
  let remaining: PlanPoint[][] = [patch.polygon];
  for (const region of regions) {
    const next: PlanPoint[][] = [];
    for (const piece of remaining) {
      const { inside, outside } = partitionPlan(piece, region.polygon);
      const kept = simplifyPlan(inside);
      if (kept.length > 0) faces.push({ surface: region.surface(patch.owner), corners: lift(kept, under) });
      next.push(...outside.map(simplifyPlan).filter((piece) => piece.length > 0));
    }
    remaining = next;
  }
  for (const piece of remaining) {
    faces.push({ surface: `surface.${patch.owner}.soffit`, corners: lift(piece, under) });
  }
  return faces;
});

/** A room-owned board ceiling. Only the underside is the room's exposed ceiling; the rest are faces of the structural gap. */
export const ceilingBoardFaces = (
  space: string, polygon: readonly PlanPoint[], underside: number, thickness: number,
): WallFace[] => prismFaces(polygon, levelPlane(underside), levelPlane(underside + thickness))
  .map((face) => ({
    surface: face.side === "bottom" ? `surface.${space}.ceiling` : `surface.${space}.ceiling-back`,
    corners: face.corners,
  }));

/** Underside face: lifts the polygon onto the plane in its own order so it faces down. */
const lift = (polygon: readonly PlanPoint[], plane: Parameters<typeof planeHeight>[0]): IAutoMovieVector3[] =>
  polygon.map((p) => ({ x: p.x, y: planeHeight(plane, p), z: p.z }));

/**
 * The end face that closes the height difference between two touching pieces of the same composition unit.
 * Along the shared edge where the higher piece's underside is above the lower piece's top, a vertical face
 * owned by the higher piece closes the gap between them (the height-difference rule of junctions).
 */
export const roofStepClosures = (patches: readonly RoofPatch[]): WallFace[] => {
  const faces: WallFace[] = [];
  for (const a of patches) {
    for (const b of patches) {
      if (a === b || a.tier !== b.tier) continue;
      a.polygon.forEach((a0, i) => {
        const a1 = a.polygon[(i + 1) % a.polygon.length]!;
        const length = Math.hypot(a1.x - a0.x, a1.z - a0.z);
        const ux = (a1.x - a0.x) / length;
        const uz = (a1.z - a0.z) / length;
        b.polygon.forEach((b0, j) => {
          const b1 = b.polygon[(j + 1) % b.polygon.length]!;
          const offLine = (p: PlanPoint) => Math.abs((p.x - a0.x) * uz - (p.z - a0.z) * ux);
          if (offLine(b0) > 1e-6 || offLine(b1) > 1e-6) return;
          const t0 = (b0.x - a0.x) * ux + (b0.z - a0.z) * uz;
          const t1 = (b1.x - a0.x) * ux + (b1.z - a0.z) * uz;
          if (t0 < t1) return; // A shared edge must run in opposite directions.
          const from = Math.max(0, t1);
          const to = Math.min(length, t0);
          if (to - from < 1e-4) return;
          const at = (t: number) => ({ x: a0.x + ux * t, z: a0.z + uz * t });
          const gap = (t: number) => planeHeight(a.height, at(t)) - a.thickness - planeHeight(b.height, at(t));
          const cuts = [from, to];
          const g0 = gap(from);
          const g1 = gap(to);
          if (g0 * g1 < 0) cuts.splice(1, 0, from + (to - from) * g0 / (g0 - g1));
          for (let k = 0; k + 1 < cuts.length; ++k) {
            const p = cuts[k]!;
            const q = cuts[k + 1]!;
            if (gap((p + q) / 2) <= 1e-4) continue;
            const corner = (t: number, upper: boolean) => {
              const point = at(t);
              const y = upper ? planeHeight(a.height, point) - a.thickness : planeHeight(b.height, point);
              return { x: point.x, y, z: point.z };
            };
            const raw = [corner(p, false), corner(p, true), corner(q, true), corner(q, false)];
            const kept = raw.filter((c, n) => {
              const next = raw[(n + 1) % raw.length]!;
              return Math.hypot(c.x - next.x, c.y - next.y, c.z - next.z) > 1e-6;
            });
            if (kept.length >= 3) faces.push({ surface: `surface.${a.owner}.edge`, corners: kept });
          }
        });
      });
    }
  }
  return faces;
};

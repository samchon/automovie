/**
 * Turns composed roof pieces into closed slab prisms with a normal thickness.
 * The top is the piece's original owner's upper surface, the sides are exposed end thickness, and the
 * underside is split by the planar region below (room, wall, exterior) into interior ceiling, support contact
 * face and exterior eave soffit. Interior sides where pieces touch hide inside the neighbouring slab. The
 * underside split is a face split on the same plane and does not change the slab shape.
 */
import type { IAutoMovieVector3 } from "@automovie/interface";
import { simplifyPlan } from "./simplifyPlan";
import { partitionPlan } from "./partitionPlan";
import { planeHeight } from "./planeHeight";
import { type RoofPatch } from "./RoofPatch";
import { type PlanPoint } from "./PlanPoint";
import { prismFaces } from "./prismFaces";
import type { WallFace } from "./WallFace";
import { UndersideRegion } from "./UndersideRegion";

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

/** Underside face: lifts the polygon onto the plane in its own order so it faces down. */
const lift = (polygon: readonly PlanPoint[], plane: Parameters<typeof planeHeight>[0]): IAutoMovieVector3[] =>
  polygon.map((p) => ({ x: p.x, y: planeHeight(plane, p), z: p.z }));


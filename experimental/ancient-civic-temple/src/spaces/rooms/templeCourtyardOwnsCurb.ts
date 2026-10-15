import type { FloorBoundaryFace } from "../../geometry/FloorBoundaryFace";
import { templePlan as p } from "../templePlan";
import { templeLevels as y } from "../templeLevels";

/**
 * Continuous stone-step surface ownership
 * Assigns the colonnade slab's courtyard-facing vertical end to the courtyard
 * without copying it. Selects only faces matching actual input coordinates and excludes buried lower faces.
 */

export const templeCourtyardOwnsCurb = (face: FloorBoundaryFace): boolean => {
  if (face.space !== "colonnade" || face.direction === "top" || face.direction === "bottom") return false;
  const withinHeight = face.corners.every((v) => v.y >= y.courtyard && v.y <= y.floor);
  if (!withinHeight) return false;
  const onX = (x: number) => face.corners.every((v) => v.x === x && v.z >= p.courtBack && v.z <= p.courtFront
  );
  const onZ = (z: number) => face.corners.every((v) => v.z === z && v.x >= p.westCourt && v.x <= p.eastCourt
  );
  return onX(p.westCourt) || onX(p.eastCourt) || onZ(p.courtBack) || onZ(p.courtFront);
};

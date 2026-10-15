import { levelPlane } from "./levelPlane";
import type { PlanPoint } from "./PlanPoint";
import { prismFaces } from "./prismFaces";
import type { WallFace } from "./WallFace";

/** A room-owned board ceiling. Only the underside is the room's exposed ceiling; the rest are faces of the structural gap. */

export const ceilingBoardFaces = (
  space: string, polygon: readonly PlanPoint[], underside: number, thickness: number
): WallFace[] => prismFaces(polygon, levelPlane(underside), levelPlane(underside + thickness))
  .map((face) => ({
    surface: face.side === "bottom" ? `surface.${space}.ceiling` : `surface.${space}.ceiling-back`,
    corners: face.corners,
  }));

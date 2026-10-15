import { cullCoincidentVerticalFaces } from "./cullCoincidentVerticalFaces";
import type { PlanPoint } from "./PlanPoint";
import type { PlanRectangle } from "./PlanRectangle";
import { plinthCells } from "./plinthCells";
import { prismFaces } from "./prismFaces";
import { rectanglePolygon } from "./rectanglePolygon";
import { WallTrimInput } from "./WallTrimInput";
import type { WallFace } from "./WallFace";

/** The side faces of a plinth cell on the outline that face the wall (hidden faces touching the wall). */
const isBackFace = (rect: PlanRectangle, normal: PlanPoint, o: PlanRectangle): boolean => (normal.x > 0.5 && Math.abs(rect.east - o.west) < 1e-9) || (normal.x < -0.5 && Math.abs(rect.west - o.east) < 1e-9) ||
  (normal.z > 0.5 && Math.abs(rect.south - o.north) < 1e-9) || (normal.z < -0.5 && Math.abs(rect.north - o.south) < 1e-9);
/** Faces of a plinth cell. The buried underside and the back against the wall are hidden joints. */

export const plinthFaces = (input: WallTrimInput): WallFace[] => cullCoincidentVerticalFaces(
  plinthCells(input).flatMap((cell) => prismFaces(rectanglePolygon(cell.rect), cell.bottom, cell.top).map((face) => {
    const hidden = face.side === "bottom" || (face.side === "edge" && isBackFace(cell.rect, face.normal, input.outline));
    return { surface: hidden ? `surface.${cell.owner}.joint` : cell.surface, corners: face.corners };
  }))
);

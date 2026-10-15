import { copingCells } from "./copingCells";
import { cullCoincidentVerticalFaces } from "./cullCoincidentVerticalFaces";
import { prismFaces } from "./prismFaces";
import { rectanglePolygon } from "./rectanglePolygon";
import { WallTrimInput } from "./WallTrimInput";
import type { WallFace } from "./WallFace";

/** Faces of a coping cell. Only the underside over the bearing face is a hidden joint; the projection's underside is coping. */

export const copingFaces = (input: WallTrimInput): WallFace[] => cullCoincidentVerticalFaces(
  copingCells(input).flatMap((cell) => prismFaces(rectanglePolygon(cell.rect), cell.bottom, cell.top).map((face) => ({
    surface: face.side === "bottom" && cell.onBed ? `surface.${cell.owner}.joint` : cell.surface, corners: face.corners,
  })))
);

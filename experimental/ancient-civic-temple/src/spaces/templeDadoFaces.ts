/**
 * Interior dado Splits colonnade
 * and sanctuary wall finishes at a horizontal line 0.60m above each room's
 * finished floor, assigning the lower region to the dado surface. This is a
 * coplanar face split without changing wall solids or other room/facade surfaces.
 */
import { splitAtLevel } from "../geometry/splitAtLevel";
import type { WallFace } from "../geometry/WallFace";
import { templeLevels as y } from "./templeLevels";
const templeInteriorDado = {
  /** Dado upper-line height above the finished floor (Y=0), m. */
  height: 0.6,
  surfaces: {
    "surface.colonnade.wall": "surface.colonnade.dado",
    "surface.sanctuary.wall": "surface.sanctuary.dado",
  } as Readonly<Record<string, string>>,
} as const;

/**
 * Splits only selected wall finishes at the dado upper line, preserving other faces.
 */
export const templeDadoFaces = (faces: readonly WallFace[]): WallFace[] => faces.flatMap((face) => {
  const dado = templeInteriorDado.surfaces[face.surface];
  return dado === undefined ? [face] : splitAtLevel(face, y.floor + templeInteriorDado.height, dado, face.surface);
});

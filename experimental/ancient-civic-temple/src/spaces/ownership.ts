/**
 * Interior dado of docs/spaces/ownership.md#interior-dado. Splits colonnade
 * and sanctuary wall finishes at a horizontal line 0.60m above each room's
 * finished floor, assigning the lower region to the dado surface. This is a
 * coplanar face split without changing wall solids or other room/facade surfaces.
 */
import { splitAtLevel } from "../geometry/face-bands";
import type { WallFace } from "../geometry/wall-solids";
import { templeLevels as y } from "./storey";

/**
 * @evidence spaces/ownership.md Holds the colonnade and sanctuary wall dado height of 0.60m and the selected surface names.
 * @evidence spaces/ownership.md#interior-dado Transfers the 0.60m upper line above the finished floor and surface.colonnade/sanctuary.wall→dado mapping unchanged from the design.
 * @evidence spaces/ownership.md#surface-map The mapping confines the dado to a split within the two owners' wall finishes, preserving other room and facade surfaces.
 * @evidence principles/core/source-units.md#source-scope-preservation Targets only two surfaces and defines height solely relative to the storey's finished floor.
 * @evidence principles/core/source-units.md#source-substantive-completion templeDadoFaces directly consumes this value containing both the height and surface mapping.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Implements the 0.60m height and two surfaces of ownership.md#interior-dado unchanged. Owner-color inspection confirmed bands interrupted at doors and continuous along the remaining wall length.
 */
export const templeInteriorDado = {
  /** Dado upper-line height above the finished floor (Y=0), m. */
  height: 0.6,
  surfaces: {
    "surface.colonnade.wall": "surface.colonnade.dado",
    "surface.sanctuary.wall": "surface.sanctuary.dado",
  } as Readonly<Record<string, string>>,
} as const;

/**
 * Splits only selected wall finishes at the dado upper line, preserving other faces.
 * @evidence spaces/ownership.md Splits wall finishes at the lower band's upper line and assigns the lower region to the dado surface.
 * @evidence principles/core/source-units.md#source-scope-preservation Splits only the two selected surfaces, preserves all other faces and does not change wall-solid geometry.
 * @evidence principles/core/source-units.md#source-substantive-completion splitAtLevel produces two coplanar convex faces and returns their array with winding preserved.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Implements the face-split rule of ownership.md#interior-dado unchanged; the split wall model still accounts as a closed solid.
 */
export const templeDadoFaces = (faces: readonly WallFace[]): WallFace[] => faces.flatMap((face) => {
  const dado = templeInteriorDado.surfaces[face.surface];
  return dado === undefined ? [face] : splitAtLevel(face, y.floor + templeInteriorDado.height, dado, face.surface);
});

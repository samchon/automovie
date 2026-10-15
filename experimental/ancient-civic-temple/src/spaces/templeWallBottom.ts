import { templeLevels } from "./templeLevels";

/**
 * Common wall bottom: one slab thickness below the lower of the outside ground contact and the
 * adjacent floor. Throws for a non-finite input.
 */
export const templeWallBottom = (
  outsideContactMinimum: number,
  adjacentFloorMinimum: number,
): number => {
  if (!Number.isFinite(outsideContactMinimum) ||
      !Number.isFinite(adjacentFloorMinimum)) {
    throw new Error("temple/storey: finite minimum heights of the actual ground and adjacent floor are required.");
  }
  return Math.min(outsideContactMinimum, adjacentFloorMinimum) -
    templeLevels.slabThickness;
};

import { templeLevels } from "./templeLevels";

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

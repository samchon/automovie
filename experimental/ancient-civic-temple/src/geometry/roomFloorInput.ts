import { FloorInput } from "./FloorInput";
import { FloorRegion } from "./FloorRegion";
import { passageRectangle } from "./passageRectangle";
import { type DoorPassage } from "./DoorPassage";

/**
 * Consumes only the room body, door profile and storey thickness and sets no new floor dimension.
 * The returned compartments are used both by later face generation and by removing the walls' threshold reservations.
 */

export const roomFloorInput = (
  space: string,
  body: readonly FloorRegion[],
  doors: readonly DoorPassage[],
  thickness: number,
  thresholdLevel: number
): FloorInput => {
  if (!Number.isFinite(thickness) || thickness <= 0) {
    throw new Error(`${space}/floor: a positive finite structural thickness is required.`);
  }
  const thresholds = doors.filter((door) => door.room === space);
  return {
    space,
    surface: `surface.${space}.floor`,
    slabs: [
      ...body.map((region) => ({
        ...region,
        bottom: region.floor - thickness, opening: null
      })),
      ...thresholds.map((door) => ({
        ...passageRectangle(door, true), id: `threshold.${door.id}`,
        floor: thresholdLevel, bottom: thresholdLevel - thickness, opening: door.id,
      })),
    ],
    supports: [
      ...body.map((region) => ({ ...region })),
      ...thresholds.map((door) => ({
        ...passageRectangle(door, false), id: `threshold.${door.id}`, floor: thresholdLevel,
      })),
    ],
  };
};

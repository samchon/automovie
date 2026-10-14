/**
 * Splits a room-owned floor input into solid compartments and walkable support regions.
 * XZ and Y are world m, and the compartments' interiors must not overlap.
 * A threshold solid extends under the frame, while support extends only to the clear width.
 * This input alone does not judge passage clearance free of member collisions.
 */
import type { PlanRectangle } from "./planar-domain";
import { passageRectangle, type DoorPassage } from "./spatial-cells";

export interface FloorRegion extends PlanRectangle {
  id: string;
  floor: number;
}

export interface FloorSlab extends FloorRegion {
  bottom: number;
  opening: string | null;
}

export interface FloorInput {
  space: string;
  surface: string;
  slabs: FloorSlab[];
  supports: FloorRegion[];
}

/**
 * Consumes only the room body, door profile and storey thickness and sets no new floor dimension.
 * The returned compartments are used both by later face generation and by removing the walls' threshold reservations.
 */
export const roomFloorInput = (
  space: string,
  body: readonly FloorRegion[],
  doors: readonly DoorPassage[],
  thickness: number,
  thresholdLevel: number,
): FloorInput => {
  if (!Number.isFinite(thickness) || thickness <= 0) {
    throw new Error(`${space}/floor: a positive finite structural thickness is required.`);
  }
  const thresholds = doors.filter((door) => door.room === space);
  return {
    space,
    surface: `surface.${space}.floor`,
    slabs: [
      ...body.map((region) => ({ ...region,
        bottom: region.floor - thickness, opening: null })),
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

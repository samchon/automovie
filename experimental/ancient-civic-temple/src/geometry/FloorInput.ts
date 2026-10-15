/**
 * Splits a room-owned floor input into solid compartments and walkable support regions.
 * XZ and Y are world m, and the compartments' interiors must not overlap.
 * A threshold solid extends under the frame, while support extends only to the clear width.
 * This input alone does not judge passage clearance free of member collisions.
 */
import { FloorRegion } from "./FloorRegion";
import { FloorSlab } from "./FloorSlab";

export interface FloorInput {
  space: string;
  surface: string;
  slabs: FloorSlab[];
  supports: FloorRegion[];
}


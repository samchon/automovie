import { FloorRegion } from "./FloorRegion";
import { FloorSlab } from "./FloorSlab";

/** A room's floor split into solid slab compartments and walkable support regions, with the surfaces they publish. */
export interface FloorInput {
  /** Room space the floor belongs to. */
  space: string;
  /** Surface identity of the finished floor. */
  surface: string;
  /** Solid slab compartments with non-overlapping interiors. */
  slabs: FloorSlab[];
  /** Walkable support regions at their finished heights. */
  supports: FloorRegion[];
}


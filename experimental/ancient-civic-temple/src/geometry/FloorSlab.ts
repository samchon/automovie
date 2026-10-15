import { FloorRegion } from "./FloorRegion";


/** A floor region extruded down to its slab bottom. */
export interface FloorSlab extends FloorRegion {
  /** Height of the slab's underside. */
  bottom: number;
  /** Door whose threshold this compartment forms, or null for a room slab. */
  opening: string | null;
}

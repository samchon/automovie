import { door } from "./door";

/** Shared void owned by this room and consumed at its floor and adjacent finish.
 */
export const DOOR_ENTRY_LIVING_DOOR = door(
  "entry-living-door",
  "ground-storey",
  -1.35,
  -0.35
);

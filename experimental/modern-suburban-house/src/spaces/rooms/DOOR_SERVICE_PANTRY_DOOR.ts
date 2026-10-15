import { door } from "./door";

/** Shared void owned by this room and consumed at its floor and adjacent finish.
 */
export const DOOR_SERVICE_PANTRY_DOOR = door(
  "service-pantry-door",
  "ground-storey",
  -5.75,
  -4.8
);

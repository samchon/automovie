import { door } from "./door";

/** Shared void owned by this room and consumed at its floor and adjacent finish.
 */
export const DOOR_SERVICE_LAUNDRY_DOOR = door(
  "service-laundry-door",
  "ground-storey",
  -4.4,
  -3.35
);

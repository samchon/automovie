import { door } from "./door";

/** Shared void owned by this room and consumed at its floor and adjacent finish.
 */
export const DOOR_SERVICE_POWDER_DOOR = door(
  "service-powder-door",
  "ground-storey",
  -1.65,
  -0.7
);

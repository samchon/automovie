import { door } from "./door";

/** Shared void owned by this room and consumed at its floor and adjacent finish.
 */
export const DOOR_HALL_PRIMARY_DOOR = door(
  "hall-primary-door",
  "upper-storey",
  -2.7,
  -1.7
);

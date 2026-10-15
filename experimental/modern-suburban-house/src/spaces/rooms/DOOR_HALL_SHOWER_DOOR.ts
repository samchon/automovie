import { door } from "./door";

/** Shared void owned by this room and consumed at its floor and adjacent finish.
 */
export const DOOR_HALL_SHOWER_DOOR = door(
  "hall-shower-door",
  "upper-storey",
  1.05,
  2.05
);

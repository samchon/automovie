import { door } from "./door";

/** Shared void owned by this room and consumed at its floor and adjacent finish.
 */
export const DOOR_LIVING_COMMON_OPENING = door(
  "living-common-opening",
  "ground-storey",
  -5.0,
  -2.15,
  2.4
);

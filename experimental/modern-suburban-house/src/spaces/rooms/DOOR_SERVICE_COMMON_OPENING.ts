import { door } from "./door";

/** Shared void owned by this room and consumed at its floor and adjacent finish.
 */
export const DOOR_SERVICE_COMMON_OPENING = door(
  "service-common-opening",
  "ground-storey",
  -1.35,
  3.07,
  2.4
);

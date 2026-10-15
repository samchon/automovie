import { roomFloorInput } from "../../geometry/roomFloorInput";
import { templeLevels as y } from "../templeLevels";
import { templeCourtyardPlan } from "./templeCourtyardPlan";

/**
 * Lower solid floor of the open courtyard, without separate artificial ground beneath the fountain.
 */

export const templeCourtyardFloor = () => roomFloorInput(
  "courtyard", [{ ...templeCourtyardPlan, id: "body", floor: y.courtyard }],
  [], y.slabThickness, y.floor
);

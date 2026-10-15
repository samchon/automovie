import { roomFloorInput } from "../../geometry/roomFloorInput";
import { templeLevels as y } from "../templeLevels";
import { templeDoorPassages } from "../templeDoorPassages";
import { templeSanctuaryPlan } from "./templeSanctuaryPlan";

/**
 * Makes only the sanctuary body and existing threshold, without inventing a local altar step.
 */
export const templeSanctuaryFloor = () => roomFloorInput(
  "sanctuary", [{ ...templeSanctuaryPlan, id: "body", floor: y.floor }],
  templeDoorPassages, y.slabThickness, y.floor
);

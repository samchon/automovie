import { roomFloorInput } from "../../geometry/roomFloorInput";
import { templeLevels as y } from "../templeLevels";
import { templeDoorPassages } from "../templeDoorPassages";
import { templeServiceYardPlan } from "./templeServiceYardPlan";

/**
 * The yard owns its east threshold to the exterior wall face and west threshold to the colonnade face.
 */

export const templeServiceYardFloor = () => roomFloorInput(
  "service-yard", [{ ...templeServiceYardPlan, id: "body", floor: y.floor }],
  templeDoorPassages, y.slabThickness, y.floor
);

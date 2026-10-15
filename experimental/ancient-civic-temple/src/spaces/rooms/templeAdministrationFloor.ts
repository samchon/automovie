import { roomFloorInput } from "../../geometry/roomFloorInput";
import { templeLevels as y } from "../templeLevels";
import { templeDoorPassages } from "../templeDoorPassages";
import { templeAdministrationPlan } from "./templeAdministrationPlan";

/**
 * Binds the body and direct threshold to the same complete floor surface.
 */
export const templeAdministrationFloor = () => roomFloorInput(
  "administration", [{ ...templeAdministrationPlan, id: "body", floor: y.floor }],
  templeDoorPassages, y.slabThickness, y.floor
);

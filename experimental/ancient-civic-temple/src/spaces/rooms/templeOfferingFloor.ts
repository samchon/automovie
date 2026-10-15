import { roomFloorInput } from "../../geometry/roomFloorInput";
import { templeLevels as y } from "../templeLevels";
import { templeDoorPassages } from "../templeDoorPassages";
import { templeOfferingPlan } from "./templeOfferingPlan";

/**
 * Returns the long room body floor and east threshold under one owner.
 */
export const templeOfferingFloor = () => roomFloorInput(
  "offering", [{ ...templeOfferingPlan, id: "body", floor: y.floor }],
  templeDoorPassages, y.slabThickness, y.floor
);

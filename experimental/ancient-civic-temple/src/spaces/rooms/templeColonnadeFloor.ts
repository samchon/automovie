import { roomFloorInput } from "../../geometry/roomFloorInput";
import { templeLevels as y } from "../templeLevels";
import { templeColonnadeRegions } from "./templeColonnadeRegions";

/**
 * One-loop floor inputs without turning cell division lines into physical seams.
 */
export const templeColonnadeFloor = () => roomFloorInput(
  "colonnade", templeColonnadeRegions.map((region) => ({ ...region, floor: y.floor })),
  [], y.slabThickness, y.floor
);

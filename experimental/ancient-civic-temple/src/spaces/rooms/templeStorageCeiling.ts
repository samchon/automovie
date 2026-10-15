import { ceilingBoardFaces } from "../../geometry/ceilingBoardFaces";
import { rectanglePolygon } from "../../geometry/rectanglePolygon";
import { templeLevels as y } from "../templeLevels";
import { templeStoragePlan } from "./templeStoragePlan";

/**
 * Low boarding ceiling solid. Takes underside Y=lowCeiling and the boarding
 * reserve above from storey-owned values; later members place exposed beam sections below that reserve.
 */

export const templeStorageCeiling = () => ceilingBoardFaces(
  "storage", rectanglePolygon(templeStoragePlan), y.lowCeiling, y.ceilingBoardReserve
);

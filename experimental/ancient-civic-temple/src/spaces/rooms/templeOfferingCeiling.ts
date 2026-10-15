import { ceilingBoardFaces } from "../../geometry/ceilingBoardFaces";
import { rectanglePolygon } from "../../geometry/rectanglePolygon";
import { templeLevels as y } from "../templeLevels";
import { templeOfferingPlan } from "./templeOfferingPlan";

/**
 * Low boarding ceiling solid. Takes underside Y=lowCeiling and the boarding
 * reserve above from storey-owned values; later members place exposed beam sections below that reserve.
 */

export const templeOfferingCeiling = () => ceilingBoardFaces(
  "offering", rectanglePolygon(templeOfferingPlan), y.lowCeiling, y.ceilingBoardReserve
);

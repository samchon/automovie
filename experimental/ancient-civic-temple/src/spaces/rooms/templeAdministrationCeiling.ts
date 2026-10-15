import { ceilingBoardFaces } from "../../geometry/ceilingBoardFaces";
import { rectanglePolygon } from "../../geometry/rectanglePolygon";
import { templeLevels as y } from "../templeLevels";
import { templeAdministrationPlan } from "./templeAdministrationPlan";

/**
 * Low boarding ceiling solid. Takes underside Y=lowCeiling and the boarding
 * reserve above from storey-owned values; later members place exposed beam sections below that reserve.
 */

export const templeAdministrationCeiling = () => ceilingBoardFaces(
  "administration", rectanglePolygon(templeAdministrationPlan), y.lowCeiling, y.ceilingBoardReserve
);

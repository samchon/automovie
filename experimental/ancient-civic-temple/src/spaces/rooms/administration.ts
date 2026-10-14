/** Front work room and direct threshold */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { roomFloorInput } from "../../geometry/floor-input";
import { rectanglePolygon } from "../../geometry/planar-domain";
import { ceilingBoardFaces } from "../../geometry/roof-solids";
import { levelCell, thresholdCells } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeDoorPassages } from "../openings";
import { templeLevels as y } from "../storey";
export const templeAdministrationPlan = {
  west: p.eastRoom, east: p.eastInner, north: p.officeBack, south: p.southInner,
} as const;

/**
 * Binds the body and direct threshold to the same complete floor surface.
 */
export const templeAdministrationFloor = () => roomFloorInput(
  "administration", [{ ...templeAdministrationPlan, id: "body", floor: y.floor }],
  templeDoorPassages, y.slabThickness, y.floor,
);
export const templeAdministration = (): IAutoMovieBuiltSpace => ({
  id: "administration", kind: "administration", parent: y.storey, fidelity: "exact",
  cells: [
    levelCell("administration.body", templeAdministrationPlan, y.floor, y.lowCeiling),
    ...thresholdCells("administration", templeDoorPassages, y.floor),
  ],
});

/**
 * Low boarding ceiling solid. Takes underside Y=lowCeiling and the boarding
 * reserve above from storey-owned values; later members place exposed beam sections below that reserve.
 */
export const templeAdministrationCeiling = () => ceilingBoardFaces(
  "administration", rectanglePolygon(templeAdministrationPlan), y.lowCeiling, y.ceilingBoardReserve,
);

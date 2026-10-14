/**
 * One long room
 * Includes a low ceiling and wall-depth threshold without a hidden rear room.
 */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { roomFloorInput } from "../../geometry/floor-input";
import { rectanglePolygon } from "../../geometry/planar-domain";
import { ceilingBoardFaces } from "../../geometry/roof-solids";
import { levelCell, thresholdCells } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeDoorPassages } from "../openings";
import { templeLevels as y } from "../storey";
export const templeOfferingPlan = {
  west: p.westInner, east: p.westRoom, north: p.northInner, south: p.southInner,
} as const;

/**
 * Returns the long room body floor and east threshold under one owner.
 */
export const templeOfferingFloor = () => roomFloorInput(
  "offering", [{ ...templeOfferingPlan, id: "body", floor: y.floor }],
  templeDoorPassages, y.slabThickness, y.floor,
);
export const templeOffering = (): IAutoMovieBuiltSpace => ({
  id: "offering", kind: "offering", parent: y.storey, fidelity: "exact",
  cells: [
    levelCell("offering.body", templeOfferingPlan, y.floor, y.lowCeiling),
    ...thresholdCells("offering", templeDoorPassages, y.floor),
  ],
});

/**
 * Low boarding ceiling solid. Takes underside Y=lowCeiling and the boarding
 * reserve above from storey-owned values; later members place exposed beam sections below that reserve.
 */
export const templeOfferingCeiling = () => ceilingBoardFaces(
  "offering", rectanglePolygon(templeOfferingPlan), y.lowCeiling, y.ceilingBoardReserve,
);

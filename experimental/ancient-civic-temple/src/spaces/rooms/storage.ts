/** Rear storage room and direct threshold */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { roomFloorInput } from "../../geometry/floor-input";
import { rectanglePolygon } from "../../geometry/planar-domain";
import { ceilingBoardFaces } from "../../geometry/roof-solids";
import { levelCell, thresholdCells } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeDoorPassages } from "../openings";
import { templeLevels as y } from "../storey";
export const templeStoragePlan = {
  west: p.eastRoom, east: p.eastInner, north: p.storageBack, south: p.storageFront,
} as const;

/**
 * Storage body and receiving threshold join on the same Y=0 support plane.
 */
export const templeStorageFloor = () => roomFloorInput(
  "storage", [{ ...templeStoragePlan, id: "body", floor: y.floor }],
  templeDoorPassages, y.slabThickness, y.floor,
);
export const templeStorage = (): IAutoMovieBuiltSpace => ({
  id: "storage", kind: "storage", parent: y.storey, fidelity: "exact",
  cells: [
    levelCell("storage.body", templeStoragePlan, y.floor, y.lowCeiling),
    ...thresholdCells("storage", templeDoorPassages, y.floor),
  ],
});

/**
 * Low boarding ceiling solid. Takes underside Y=lowCeiling and the boarding
 * reserve above from storey-owned values; later members place exposed beam sections below that reserve.
 */
export const templeStorageCeiling = () => ceilingBoardFaces(
  "storage", rectanglePolygon(templeStoragePlan), y.lowCeiling, y.ceilingBoardReserve,
);

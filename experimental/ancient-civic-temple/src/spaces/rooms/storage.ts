/** Rear storage room and direct threshold of docs/spaces/rooms/storage.md#storage-volume. */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { roomFloorInput } from "../../geometry/floor-input";
import { rectanglePolygon } from "../../geometry/planar-domain";
import { ceilingBoardFaces } from "../../geometry/roof-solids";
import { levelCell, thresholdCells } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeDoorPassages } from "../openings";
import { templeLevels as y } from "../storey";

/**
 * @evidence spaces/rooms/storage.md Defines the storage body plan by four datums: east-room~east-inner and storage-back~storage-front.
 * @evidence principles/core/source-units.md#source-scope-preservation Uses only east-room, east-inner, storage-back and storage-front to set room ends, inventing no interior dimensions.
 * @evidence principles/core/source-units.md#source-substantive-completion One as const rectangle gives storage floors, body cells and boarding ceiling the same plan between records and the service yard.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Transfers the storage range of rooms/storage.md (east-room~east-inner, storage-back~storage-front) unchanged; wall and threshold interfaces fit with 0 overlap.
 */
export const templeStoragePlan = {
  west: p.eastRoom, east: p.eastInner, north: p.storageBack, south: p.storageFront,
} as const;

/**
 * Storage body and receiving threshold join on the same Y=0 support plane.
 * @evidence spaces/rooms/storage.md Emits slabs and supports for the storage body and colonnade-side threshold under one surface owner, surface.storage.floor.
 * @evidence spaces/storey.md#threshold-support Passes the door table to roomFloorInput so storage owns the east-spine door-storage threshold slab across full wall depth and frame width, with support confined to the clear 1.1m width.
 * @evidence principles/core/source-units.md#source-scope-preservation Takes finished floor Y=0 and structure 0.18m from the storey and selects only the receiving door with room=storage for its threshold.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns storage body and door-storage threshold slab/support compartments together, sharing inputs between floor-face generation and the east spine's threshold reservation.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Storage floor and door-storage receiving-threshold ownership hold as specified by rooms/storage.md and storey.md#threshold-support; no overlap with records/yard floors occurs under partitions, exposing no parent decision to repair.
 */
export const templeStorageFloor = () => roomFloorInput(
  "storage", [{ ...templeStoragePlan, id: "body", floor: y.floor }],
  templeDoorPassages, y.slabThickness, y.floor,
);

/**
 * @evidence spaces/rooms/storage.md Emits the storage space record (id storage, parent temple-ground) with exact cells.
 * @evidence spaces/rooms/storage.md#storage-volume Combines the 4.0×3.7m storage body and receiving-door threshold (door-storage, width 1.1m, centre Z=-0.3) as one space, with no door in the yard-side shared wall.
 * @evidence principles/core/source-units.md#source-scope-preservation Uses the storey's low ceiling 3.10m as the storage cell cap, without adding neighboring records/service-yard areas.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns one space record containing body and door-storage threshold cells; observation stations and colonnade connectors use those cells for containment.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The 4.0×3.7m range and 3.10m cap of rooms/storage.md#storage-volume hold unchanged; the door-storage connector endpoint lies inside the room cell, exposing no parent decision to repair.
 */
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
 * @evidence spaces/rooms/storage.md Emits the low storage boarding ceiling as a plate with underside 3.10m and thickness 0.10m.
 * @evidence principles/core/source-units.md#source-scope-preservation Uses only the storey's low ceiling height and boarding reserve over the storage plan; exposed beams above chests belong to later members.
 * @evidence principles/core/source-units.md#source-substantive-completion ceilingBoardFaces returns a closed 4.0×3.7m storage plate with surface.storage.ceiling underneath and ceiling-back on top and sides.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Using the 3.10m·0.10m reserve of rooms/storage.md and storey.md unchanged, the storage boarding ends at the open-yard wall; no parent decision needed repair.
 */
export const templeStorageCeiling = () => ceilingBoardFaces(
  "storage", rectanglePolygon(templeStoragePlan), y.lowCeiling, y.ceilingBoardReserve,
);

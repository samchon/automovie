/**
 * Open service yard of docs/spaces/rooms/service-yard.md#yard-volume.
 * Both west/east thresholds belong to this yard, without new ground or ceilings.
 */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { roomFloorInput } from "../../geometry/floor-input";
import { levelCell, thresholdCells } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeDoorPassages } from "../openings";
import { templeRoofRules } from "../roofs/assembly";
import { templeLevels as y } from "../storey";

/**
 * @evidence spaces/rooms/service-yard.md Defines the service-yard body plan by four datums: east-room~east-inner and north-inner~yard-front.
 * @evidence principles/core/source-units.md#source-scope-preservation Uses only east-room, east-inner, north-inner and yard-front to set yard ends, inventing no interior dimensions.
 * @evidence principles/core/source-units.md#source-substantive-completion One as const rectangle gives yard floors and open cells the same plan, without a ceiling.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Transfers the service-yard range of rooms/service-yard.md (east-room~east-inner, north-inner~yard-front) unchanged; wall and threshold interfaces fit with 0 overlap.
 */
export const templeServiceYardPlan = {
  west: p.eastRoom, east: p.eastInner, north: p.northInner, south: p.yardFront,
} as const;

/**
 * The yard owns its east threshold to the exterior wall face and west threshold to the colonnade face.
 * @evidence spaces/rooms/service-yard.md Emits slabs and supports for the yard body, west yard-door threshold and east exterior service threshold under one surface owner, surface.service-yard.floor.
 * @evidence spaces/storey.md#threshold-support Passes the door table to roomFloorInput so the yard owns door-yard slabs/supports west to the colonnade face and door-service-exterior east to the exterior wall face.
 * @evidence principles/core/source-units.md#source-scope-preservation Takes finished floor Y=0 and structure 0.18m from the storey, selecting only the two doors with room=service-yard for thresholds.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns yard body and both threshold slab/support compartments together, sharing inputs between floor-face generation and threshold reservations in the east spine and exterior wall.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Yard floor and door-yard/door-service-exterior threshold ownership hold as specified by rooms/service-yard.md and storey.md#threshold-support; the east threshold meets the site service-apron paving at the exterior wall face, exposing no parent decision to repair.
 */
export const templeServiceYardFloor = () => roomFloorInput(
  "service-yard", [{ ...templeServiceYardPlan, id: "body", floor: y.floor }],
  templeDoorPassages, y.slabThickness, y.floor,
);

/**
 * @evidence spaces/rooms/service-yard.md Emits the service-yard space record (id service-yard, parent temple-ground) with exact cells.
 * @evidence spaces/rooms/service-yard.md#yard-volume Combines the 4.0×7.2m open yard and west colonnade-door (door-yard)/east exterior service-door (door-service-exterior) thresholds as one space, whose upper bound does not block the sky.
 * @evidence principles/core/source-units.md#source-scope-preservation Uses the open yard's logical cap 3.20m (colonnade eave-support height) as the cell cap, without adding exterior areas or hidden annexes.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns the yard body cell capped at court-eave and both west/east threshold cells; site and colonnade connectors use those cells for containment.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The 4.0×7.2m open range and court-eave cap of rooms/service-yard.md#yard-volume hold unchanged; both connector endpoints lie inside the yard cells, exposing no parent decision to repair.
 */
export const templeServiceYard = (): IAutoMovieBuiltSpace => ({
  id: "service-yard", kind: "service-yard", parent: y.storey, fidelity: "exact",
  cells: [
    levelCell("service-yard.body", templeServiceYardPlan, y.floor, templeRoofRules.courtEave),
    ...thresholdCells("service-yard", templeDoorPassages, y.floor),
  ],
});

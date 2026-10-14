/**
 * Clear door/clerestory dimensions and cut-profile inputs from docs/spaces/openings.md.
 * Derives wall depth from shared datums and voids from frame allowances.
 * Makes no fills, operations or wall meshes, and profiles alone do not establish
 * complete doors. Room thresholds, wall cuts and member placement share these values.
 */
import type { IAutoMovieOpeningProfile } from "@automovie/interface";
import type { DoorPassage } from "../geometry/spatial-cells";
import type { WallVoid } from "../geometry/wall-solids";
import { templePlan as p } from "./building";
import { templeLevels as y } from "./storey";

/**
 * @evidence spaces/openings.md One table holds eight doors' boundaries, rooms, adjacent spaces, axes, centres, wall-thickness ranges, clear widths/heights, frames, leaf thicknesses and swings.
 * @evidence spaces/openings.md#doors Transfers the door table's clear sizes unchanged: main door 1.8×2.5, sanctuary 1.4×2.5, offering 1.2×2.3, administration/records/yard 1.0×2.2, storage/service 1.1×2.2, together with swing reservations.
 * @evidence principles/core/source-units.md#source-scope-preservation Uses only the table's door positions and dimensions and makes no door-leaf geometry.
 * @evidence principles/core/source-units.md#source-substantive-completion The DoorPassage list gives wall voids, thresholds, connectors and observations the same door values.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Implements the eight doors of openings.md#doors unchanged; door connector endpoints and threshold cells were all established.
 */
export const templeDoorPassages: readonly DoorPassage[] = [
  { id: "door-entry", boundary: "boundary-entry", room: "entrance",
    adjacent: "colonnade", axis: "x", center: 0,
    wallLow: p.entranceBack, wallHigh: p.entranceFront,
    width: 1.8, height: 2.5, frame: 0.06, leafThickness: 0.05, swing: "room-double" },
  { id: "door-sanctuary", boundary: "boundary-sanctuary-south", room: "sanctuary",
    adjacent: "colonnade", axis: "x", center: 0,
    wallLow: p.sanctuaryFront, wallHigh: p.northRing,
    width: 1.4, height: 2.5, frame: 0.06, leafThickness: 0.05, swing: "room-double" },
  { id: "door-offering", boundary: "boundary-west-spine.colonnade", room: "offering",
    adjacent: "colonnade", axis: "z", center: 2.175,
    wallLow: p.westRoom, wallHigh: p.westRing,
    width: 1.2, height: 2.3, frame: 0.06, leafThickness: 0.05, swing: "room-north" },
  { id: "door-administration", boundary: "boundary-east-spine.administration", room: "administration",
    adjacent: "colonnade", axis: "z", center: 7.65,
    wallLow: p.eastRing, wallHigh: p.eastRoom,
    width: 1, height: 2.2, frame: 0.06, leafThickness: 0.05, swing: "room-south" },
  { id: "door-records", boundary: "boundary-east-spine.records", room: "records",
    adjacent: "colonnade", axis: "z", center: 3.725,
    wallLow: p.eastRing, wallHigh: p.eastRoom,
    width: 1, height: 2.2, frame: 0.06, leafThickness: 0.05, swing: "room-south" },
  { id: "door-storage", boundary: "boundary-east-spine.storage", room: "storage",
    adjacent: "colonnade", axis: "z", center: -0.3,
    wallLow: p.eastRing, wallHigh: p.eastRoom,
    width: 1.1, height: 2.2, frame: 0.06, leafThickness: 0.05, swing: "room-south" },
  { id: "door-yard", boundary: "boundary-east-spine.yard", room: "service-yard",
    adjacent: "colonnade", axis: "z", center: -3.15,
    wallLow: p.eastRing, wallHigh: p.eastRoom,
    width: 1, height: 2.2, frame: 0.06, leafThickness: 0.05, swing: "room-north" },
  { id: "door-service-exterior", boundary: "boundary-east.service-yard", room: "service-yard",
    adjacent: "exterior", axis: "z", center: -6.4,
    wallLow: p.eastInner, wallHigh: p.eastOuter,
    width: 1.1, height: 2.2, frame: 0.06, leafThickness: 0.05, swing: "room-north" },
];

/**
 * Profile with host origin at length coordinate 0, Y=0, and local +X along increasing length.
 * @evidence spaces/openings.md Derives one door's host-local XY profile from clear width/height and frame thickness.
 * @evidence principles/core/source-units.md#source-scope-preservation Adds only the 0.06m frame beside the clear width and above the head, without another allowance.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns a four-vertex rectangular outline shared by opening.profile and the wall void.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Implements the profile rule of openings.md#boundary-ownership (clear dimensions plus frame) unchanged.
 */
export const templeDoorProfile = (door: DoorPassage): IAutoMovieOpeningProfile => {
  const half = door.width / 2 + door.frame;
  return { outline: [
    { x: door.center - half, y: y.floor },
    { x: door.center + half, y: y.floor },
    { x: door.center + half, y: y.floor + door.height + door.frame },
    { x: door.center - half, y: y.floor + door.height + door.frame },
  ] };
};

/**
 * Actual window-cut inputs for sanctuary gables (north/south, X=±1.0m,
 * sill 4.6m) and side walls (west/east spines, Z=-8.0/-5.8m, sill 4.0m).
 * Profile x is the host length coordinate.
 * @evidence spaces/openings.md Emits the eight sanctuary clerestories' IDs, bound boundaries, pierced-wall ranges, clear 0.4m, frames, sill heights and profiles.
 * @evidence spaces/openings.md#clerestories Places gable windows at X=±1.0m, sill 4.6m on the north and upper south boundaries, and side windows at Z=-8.0/-5.8m, sill 4.0m on both upper spine boundaries.
 * @evidence principles/core/source-units.md#source-scope-preservation Uses only designed window positions, heights and boundaries, without adding glazing or windows.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns a profile-bearing entry per window so wall voids and openings share the same outlines.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work Binding south/side windows to boundaries between sanctuary and colonnade/offering prevented the census from emitting exterior openings and produced invalid thresholds inside offering/colonnade. First added the openings.md#boundary-ownership rule splitting exposed faces above neighboring volumes into .upper/-upper boundaries, then changed #clerestories to bind windows to them (c7af729c), before transferring the decision to source.
 */
export const templeClerestories = () => {
  const window = (id: string, boundary: string, center: number, sill: number, wallLow: number, wallHigh: number) => ({
    id, boundary, wallLow, wallHigh, clearWidth: 0.4, clearHeight: 0.4, sill, frame: 0.06,
    profile: { outline: [
      { x: center - 0.4 / 2 - 0.06, y: sill - 0.06 },
      { x: center + 0.4 / 2 + 0.06, y: sill - 0.06 },
      { x: center + 0.4 / 2 + 0.06, y: sill + 0.4 + 0.06 },
      { x: center - 0.4 / 2 - 0.06, y: sill + 0.4 + 0.06 },
    ] } satisfies IAutoMovieOpeningProfile,
  });
  return [
    ...[-1, 1].map((c) => window(`window-sanctuary-north-${c < 0 ? "west" : "east"}`, "boundary-north.sanctuary", c, 4.6, p.northOuter, p.northInner)),
    ...[-1, 1].map((c) => window(`window-sanctuary-south-${c < 0 ? "west" : "east"}`, "boundary-sanctuary-south.upper", c, 4.6, p.sanctuaryFront, p.northRing)),
    ...[-8, -5.8].map((z) => window(`window-sanctuary-west-${z < -7 ? "north" : "south"}`, "boundary-west-spine.sanctuary-upper", z, 4, p.westRoom, p.westRing)),
    ...[-8, -5.8].map((z) => window(`window-sanctuary-east-${z < -7 ? "north" : "south"}`, "boundary-east-spine.sanctuary-upper", z, 4, p.eastRing, p.eastRoom)),
  ];
};

/**
 * Door void removed from wall solids. Length spans clear width plus both
 * frames; height spans the threshold slab underside through head plus frame.
 * Shares the storey.md#threshold-support reservation removing threshold slab volume from walls.
 * @evidence spaces/openings.md Emits the length and height intervals one door removes from its wall solid.
 * @evidence spaces/storey.md#threshold-support Sets the void bottom at the threshold slab underside (finished floor−0.18m), clearing the wall's threshold reservation.
 * @evidence principles/core/source-units.md#source-scope-preservation Clears only clear width plus both frames in length and head plus frame above.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns one WallVoid so wallColumns retains only wall below the threshold and above the lintel.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Implements the void ranges of openings.md#boundary-ownership and storey.md#threshold-support unchanged.
 */
export const templeDoorVoid = (door: DoorPassage): WallVoid => ({
  id: door.id,
  from: door.center - door.width / 2 - door.frame,
  to: door.center + door.width / 2 + door.frame,
  bottom: y.floor - y.slabThickness,
  top: y.floor + door.height + door.frame,
});

/**
 * Selects only one wall's door voids by boundary-ID prefix.
 * @evidence spaces/openings.md Selects only one wall's door voids by boundary-ID prefix.
 * @evidence principles/core/source-units.md#source-scope-preservation Only filters the door table into voids, without creating new doors.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns the selected wall's WallVoid list.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Consumes the door-boundary bindings of openings.md unchanged.
 */
export const templeDoorVoidsOn = (boundaryPrefix: string): WallVoid[] =>
  templeDoorPassages.filter((door) => door.boundary.startsWith(boundaryPrefix)).map(templeDoorVoid);

/**
 * Actual gable-clerestory voids, matching profile ranges including frame thickness.
 * @evidence spaces/openings.md Emits profile-sized voids for clerestories belonging to one boundary.
 * @evidence principles/core/source-units.md#source-scope-preservation Selects only windows whose bound boundary matches exactly.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns WallVoids matching each profile's x/y ranges.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Consumes the bound boundaries and frame-inclusive ranges of openings.md#clerestories unchanged.
 */
export const templeClerestoryVoidsOn = (boundary: string): WallVoid[] =>
  templeClerestories().filter((window) => window.boundary === boundary).map((window) => {
    const xs = window.profile.outline.map((point) => point.x);
    const ys = window.profile.outline.map((point) => point.y);
    return {
      id: window.id,
      from: Math.min(...xs), to: Math.max(...xs),
      bottom: Math.min(...ys), top: Math.max(...ys),
    };
  });

/**
 * Clear door/clerestory dimensions and cut-profile inputs
 * Derives wall depth from shared datums and voids from frame allowances.
 * Makes no fills, operations or wall meshes, and profiles alone do not establish
 * complete doors. Room thresholds, wall cuts and member placement share these values.
 */
import type { IAutoMovieOpeningProfile } from "@automovie/interface";
import type { DoorPassage } from "../geometry/spatial-cells";
import type { WallVoid } from "../geometry/wall-solids";
import { templePlan as p } from "./building";
import { templeLevels as y } from "./storey";
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
 * Shares the  reservation removing threshold slab volume from walls.
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
 */
export const templeDoorVoidsOn = (boundaryPrefix: string): WallVoid[] =>
  templeDoorPassages.filter((door) => door.boundary.startsWith(boundaryPrefix)).map(templeDoorVoid);

/**
 * Actual gable-clerestory voids, matching profile ranges including frame thickness.
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

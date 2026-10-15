/**
 * Clear door/clerestory dimensions and cut-profile inputs
 * Derives wall depth from shared datums and voids from frame allowances.
 * Makes no fills, operations or wall meshes, and profiles alone do not establish
 * complete doors. Room thresholds, wall cuts and member placement share these values.
 */
import type { DoorPassage } from "../geometry/DoorPassage";
import type { WallVoid } from "../geometry/WallVoid";
import { templeLevels as y } from "./templeLevels";
import { templeDoorPassages } from "./templeDoorPassages";
/**
 * Door void removed from wall solids. Length spans clear width plus both
 * frames; height spans the threshold slab underside through head plus frame.
 * Shares the  reservation removing threshold slab volume from walls.
 */
const templeDoorVoid = (door: DoorPassage): WallVoid => ({
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


import { copingCells } from "../geometry/copingCells";
import type { FloorInput } from "../geometry/FloorInput";
import { plinthCells } from "../geometry/plinthCells";
import { rectanglePolygon } from "../geometry/rectanglePolygon";
import type { RoofPatch } from "../geometry/RoofPatch";
import type { WallTrimInput } from "../geometry/WallTrimInput";
import { wallColumns } from "../geometry/wallColumns";
import type { WallSpec } from "../geometry/WallSpec";
import { ScanSolid } from "./ScanSolid";


export const envelopeSolids = (input: {
  walls: readonly WallSpec[]; roof: readonly RoofPatch[]; trim: WallTrimInput; floors: readonly FloorInput[];
}): ScanSolid[] => [
    ...input.walls.flatMap((wall) => wallColumns(wall, input.roof).flatMap((column) => column.intervals.map((interval) => ({ group: wall.id, polygon: column.polygon, bottom: interval.bottom, top: interval.top })))),
    ...input.roof.map((patch) => ({
      group: `roof:${patch.owner}:${patch.id}`, polygon: patch.polygon,
      bottom: { ...patch.height, constant: patch.height.constant - patch.thickness }, top: patch.height,
    })),
    ...copingCells(input.trim).map((cell) => ({ group: "trim:coping", polygon: rectanglePolygon(cell.rect), bottom: cell.bottom, top: cell.top })),
    ...plinthCells(input.trim).map((cell) => ({ group: "trim:plinth", polygon: rectanglePolygon(cell.rect), bottom: cell.bottom, top: cell.top })),
    ...input.floors.flatMap((floor) => floor.slabs.map((slab) => ({
      group: `floor:${floor.space}`, polygon: rectanglePolygon(slab),
      bottom: { x: 0, z: 0, constant: slab.bottom }, top: { x: 0, z: 0, constant: slab.floor },
    }))),
  ];

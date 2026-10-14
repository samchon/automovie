/**
 * Builds the engine's convex cells from the plan, finished faces and real roof underside a space owner gives.
 * These are logical boundaries and do not guarantee floor or wall meshes, empty space or collision-free passage.
 * When the roof does not cover a room body, the gap is not filled with a box; an error is returned.
 */
import type { IAutoMovieConvexSpaceCell } from "@automovie/interface";
import {
  edgeInside, partitionPlan, rectanglePolygon,
  type HeightPlane, type PlanPoint, type PlanRectangle, type RoofPatch,
} from "./planar-domain";

export interface DoorPassage {
  id: string;
  boundary: string;
  room: string;
  adjacent: string;
  axis: "x" | "z";
  center: number;
  wallLow: number;
  wallHigh: number;
  width: number;
  height: number;
  frame: number;
  leafThickness: number;
  swing: "room-double" | "room-north" | "room-south";
}

/** Derives the threshold plan from the real wall-depth and passage width. */
export const passageRectangle = (door: DoorPassage, includeFrame: boolean): PlanRectangle => {
  const halfWidth = door.width / 2 + (includeFrame ? door.frame : 0);
  return door.axis === "x"
    ? { west: door.center - halfWidth, east: door.center + halfWidth,
      north: door.wallLow, south: door.wallHigh }
    : { west: door.wallLow, east: door.wallHigh,
      north: door.center - halfWidth, south: door.center + halfWidth };
};

/** The exact convex cell over a CCW polygon, at or above floor and at or below ceiling. */
export const polygonCell = (
  id: string, polygon: readonly PlanPoint[], floor: number, ceiling: HeightPlane,
): IAutoMovieConvexSpaceCell => ({
  id,
  planes: [
    ...polygon.map((point, i) => {
      const edge = edgeInside(point, polygon[(i + 1) % polygon.length]!);
      return { normal: { x: -edge.x, y: 0, z: -edge.z }, offset: edge.constant };
    }),
    { normal: { x: 0, y: -1, z: 0 }, offset: -floor },
    { normal: { x: -ceiling.x, y: 1, z: -ceiling.z }, offset: ceiling.constant },
  ],
});

/** A finite open yard or low-ceiling body. The upper bound is not render geometry. */
export const levelCell = (
  id: string, rect: PlanRectangle, floor: number, ceiling: number,
): IAutoMovieConvexSpaceCell => polygonCell(
  id, rectanglePolygon(rect), floor, { x: 0, z: 0, constant: ceiling },
);

/** Decomposes per real composed roof piece and requires the whole room plan to be covered. The underside is lower by the piece's vertical thickness. */
export const roofedCells = (
  id: string, rect: PlanRectangle, floor: number, roof: readonly RoofPatch[],
): IAutoMovieConvexSpaceCell[] => {
  const bounds = rectanglePolygon(rect);
  let covered = 0;
  const cells = roof.flatMap((patch) => {
    const { inside } = partitionPlan(bounds, patch.polygon);
    if (inside.length === 0) return [];
    covered += area(inside);
    return [polygonCell(`${id}.${patch.id}`, inside, floor, {
      ...patch.height, constant: patch.height.constant - patch.thickness,
    })];
  });
  if (Math.abs(covered - area(bounds)) > 1e-6) {
    throw new Error(`${id}: roof coverage ${covered}m² differs from the body ${area(bounds)}m².`);
  }
  return cells;
};

/** Builds only the clear passage volume, without the door frame, as an extra cell owned by that room. */
export const thresholdCells = (
  room: string, doors: readonly DoorPassage[], floor: number,
): IAutoMovieConvexSpaceCell[] => doors.filter((door) => door.room === room)
  .map((door) => levelCell(
    `${room}.threshold.${door.id}`, passageRectangle(door, false),
    floor, floor + door.height,
  ));

/** XZ area (m²) of a CCW polygon. The coverage check is not a camera or visual judgment. */
const area = (polygon: readonly PlanPoint[]): number => polygon.reduce((sum, a, i) => {
  const b = polygon[(i + 1) % polygon.length]!;
  return sum + a.x * b.z - b.x * a.z;
}, 0) / 2;

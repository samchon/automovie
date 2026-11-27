import {
  IAutoMovieBuiltSpace,
  IAutoMovieDrawingScheduleBox,
  IAutoMovieHalfSpacePlane,
  IAutoMovieVector3,
} from "@automovie/interface";

import { drawingRange } from "./drawingRange";
import { roundDrawingVector } from "./roundDrawingVector";

/*
 * The world box a space's own declared volume fills, on the drawing grid, or
 * `null` when it declares none this can state exactly.
 *
 * A shell states its vertices, so its box is their bounds. Cells state
 * half-spaces, and a box follows from them only where every plane faces one
 * axis and every axis is closed on both sides; the space's box is then the
 * union of its cells' boxes. A chamfered cell, a cell left open on one side and
 * a space with neither cells nor shell yield `null` rather than an
 * approximation, because a room schedule that printed a made-up extent would be
 * read as a measurement.
 * Parameter space: The validated space.
 * Returns: The declared box in world metres, or `null`.
 */
export const drawingSpaceBox = (
  space: IAutoMovieBuiltSpace,
): IAutoMovieDrawingScheduleBox | null => {
  if (space.shell !== undefined) return boxOf(space.shell.vertices);
  if (space.cells.length === 0) return null;
  const corners: IAutoMovieVector3[] = [];
  for (const cell of space.cells) {
    const box: IAutoMovieDrawingScheduleBox | null = axisAlignedCellBox(
      cell.planes,
    );
    if (box === null) return null;
    corners.push(box.min, box.max);
  }
  return boxOf(corners);
};

/*
 * How far a plane normal's off-axis components may reach and still face one
 * axis: float noise in a hand-written or transformed unit normal, far below
 * anything a reader would call a chamfer.
 */
const PLANE_AXIS_EPSILON: number = 1e-9;

/*
 * The three world axes, in the order a box's components are stated.
 */
const AXES: readonly ("x" | "y" | "z")[] = ["x", "y", "z"];

/*
 * The box a cell's half-spaces close, when they are axis-aligned and closed.
 */
const axisAlignedCellBox = (
  planes: readonly IAutoMovieHalfSpacePlane[],
): IAutoMovieDrawingScheduleBox | null => {
  const min: IAutoMovieVector3 = { x: -Infinity, y: -Infinity, z: -Infinity };
  const max: IAutoMovieVector3 = { x: Infinity, y: Infinity, z: Infinity };
  for (const plane of planes) {
    const axis: "x" | "y" | "z" | null = alignedAxis(plane.normal);
    if (axis === null) return null;
    const scale: number = plane.normal[axis];
    const value: number = plane.offset / scale;
    if (scale > 0) max[axis] = Math.min(max[axis], value);
    else min[axis] = Math.max(min[axis], value);
  }
  // An axis no plane bounds keeps its unbounded maximum.
  return AXES.every((axis: "x" | "y" | "z"): boolean => max[axis] !== Infinity)
    ? { min, max }
    : null;
};

/*
 * The one axis a normal faces, or `null` when it faces between axes.
 */
const alignedAxis = (normal: IAutoMovieVector3): "x" | "y" | "z" | null => {
  const facing: ("x" | "y" | "z")[] = AXES.filter(
    (axis: "x" | "y" | "z"): boolean =>
      Math.abs(normal[axis]) > PLANE_AXIS_EPSILON,
  );
  return facing.length === 1 ? facing[0]! : null;
};

/*
 * The rounded bounds of a non-empty point list, folded per axis.
 */
const boxOf = (
  points: readonly IAutoMovieVector3[],
): IAutoMovieDrawingScheduleBox => {
  const x: { min: number; max: number } = drawingRange(
    coordinates(points, "x"),
  );
  const y: { min: number; max: number } = drawingRange(
    coordinates(points, "y"),
  );
  const z: { min: number; max: number } = drawingRange(
    coordinates(points, "z"),
  );
  return {
    min: roundDrawingVector({ x: x.min, y: y.min, z: z.min }),
    max: roundDrawingVector({ x: x.max, y: y.max, z: z.max }),
  };
};

/*
 * One coordinate of every point, without building an array.
 */
function* coordinates(
  points: readonly IAutoMovieVector3[],
  axis: "x" | "y" | "z",
): Generator<number, void, undefined> {
  for (const point of points) yield point[axis];
}

/** Roof boundary classification shared by all eight pitched roof owners. */
import type { IAutoMovieVector3 } from "@automovie/interface";
import { GARAGE_OUTLINE } from "../GARAGE_OUTLINE";
import { GABLE_CORNERS } from "./GABLE_CORNERS";
import { RIGHT_EAVE_X } from "./RIGHT_EAVE_X";
import { LEFT_EAVE_X } from "./LEFT_EAVE_X";
import { gBack } from "./gBack";
import { gableHeight } from "./gableHeight";
import { rFront } from "./rFront";
import { mFront } from "./mFront";
import { GARAGE_RIDGE_Z } from "./GARAGE_RIDGE_Z";
import { MAIN_RIDGE_Z } from "./MAIN_RIDGE_Z";
import { SPLIT_X } from "./SPLIT_X";
import { OVERHANG } from "./OVERHANG";

type Edge = readonly [IAutoMovieVector3, IAutoMovieVector3];
const point = (x: number, y: number, z: number): IAutoMovieVector3 => ({
  x,
  y,
  z,
});
const segment = (a: IAutoMovieVector3, b: IAutoMovieVector3): Edge => [a, b];
const shared: Edge[] = [
  segment(
    point(LEFT_EAVE_X, mFront(MAIN_RIDGE_Z), MAIN_RIDGE_Z),
    point(SPLIT_X, mFront(MAIN_RIDGE_Z), MAIN_RIDGE_Z),
  ),
  segment(
    point(SPLIT_X, rFront(MAIN_RIDGE_Z), MAIN_RIDGE_Z),
    point(RIGHT_EAVE_X, rFront(MAIN_RIDGE_Z), MAIN_RIDGE_Z),
  ),
  segment(
    point(GARAGE_OUTLINE.inner.x[0], gBack(GARAGE_RIDGE_Z), GARAGE_RIDGE_Z),
    point(
      GARAGE_OUTLINE.outer.x[1] + OVERHANG.garage,
      gBack(GARAGE_RIDGE_Z),
      GARAGE_RIDGE_Z,
    ),
  ),
  segment(
    point(
      GABLE_CORNERS.apex.x,
      gableHeight(GABLE_CORNERS.apex.x),
      GABLE_CORNERS.apex.z,
    ),
    point(
      GABLE_CORNERS.ridgeFront.x,
      gableHeight(GABLE_CORNERS.ridgeFront.x),
      GABLE_CORNERS.ridgeFront.z,
    ),
  ),
  segment(
    point(
      GABLE_CORNERS.leftFoot.x,
      mFront(GABLE_CORNERS.leftFoot.z),
      GABLE_CORNERS.leftFoot.z,
    ),
    point(
      GABLE_CORNERS.apex.x,
      mFront(GABLE_CORNERS.apex.z),
      GABLE_CORNERS.apex.z,
    ),
  ),
  segment(
    point(
      GABLE_CORNERS.apex.x,
      mFront(GABLE_CORNERS.apex.z),
      GABLE_CORNERS.apex.z,
    ),
    point(
      GABLE_CORNERS.rightFoot.x,
      mFront(GABLE_CORNERS.rightFoot.z),
      GABLE_CORNERS.rightFoot.z,
    ),
  ),
];

const onSegment = (p: IAutoMovieVector3, [a, b]: Edge): boolean => {
  const d = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
  const q = { x: p.x - a.x, y: p.y - a.y, z: p.z - a.z };
  const length2 = d.x * d.x + d.y * d.y + d.z * d.z;
  const t = (q.x * d.x + q.y * d.y + q.z * d.z) / length2;
  return t >= -1e-7 && t <= 1 + 1e-7 &&
    Math.hypot(q.x - t * d.x, q.y - t * d.y, q.z - t * d.z) < 1e-6;
};

/** Only a coincident weather edge belonging to another roof plane stays open.
 */
export const roofFreeEdge = (a: IAutoMovieVector3, b: IAutoMovieVector3): boolean =>
  !shared.some((edge) => onSegment(a, edge) && onSegment(b, edge));

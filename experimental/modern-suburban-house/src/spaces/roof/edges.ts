/** Roof boundary classification shared by all eight pitched roof owners. */
import type { IAutoMovieVector3 } from "@automovie/interface";
import { GARAGE } from "../building";
import {
  GABLE_CORNERS,
  GARAGE_RIDGE_Z,
  LEFT_EAVE_X,
  MAIN_RIDGE_Z,
  OVERHANG,
  RIGHT_EAVE_X,
  SPLIT_X,
  gBack,
  gable,
  mFront,
  rFront,
} from "./junctions";

type Edge = readonly [IAutoMovieVector3, IAutoMovieVector3];
const point = (x: number, y: number, z: number): IAutoMovieVector3 => ({ x, y, z });
const segment = (a: IAutoMovieVector3, b: IAutoMovieVector3): Edge => [a, b];
const shared: Edge[] = [
  segment(point(LEFT_EAVE_X, mFront(MAIN_RIDGE_Z), MAIN_RIDGE_Z), point(SPLIT_X, mFront(MAIN_RIDGE_Z), MAIN_RIDGE_Z)),
  segment(point(SPLIT_X, rFront(MAIN_RIDGE_Z), MAIN_RIDGE_Z), point(RIGHT_EAVE_X, rFront(MAIN_RIDGE_Z), MAIN_RIDGE_Z)),
  segment(point(GARAGE.inner.x[0], gBack(GARAGE_RIDGE_Z), GARAGE_RIDGE_Z), point(GARAGE.outer.x[1] + OVERHANG.garage, gBack(GARAGE_RIDGE_Z), GARAGE_RIDGE_Z)),
  segment(point(GABLE_CORNERS.apex.x, gable(GABLE_CORNERS.apex.x), GABLE_CORNERS.apex.z), point(GABLE_CORNERS.ridgeFront.x, gable(GABLE_CORNERS.ridgeFront.x), GABLE_CORNERS.ridgeFront.z)),
  segment(point(GABLE_CORNERS.leftFoot.x, mFront(GABLE_CORNERS.leftFoot.z), GABLE_CORNERS.leftFoot.z), point(GABLE_CORNERS.apex.x, mFront(GABLE_CORNERS.apex.z), GABLE_CORNERS.apex.z)),
  segment(point(GABLE_CORNERS.apex.x, mFront(GABLE_CORNERS.apex.z), GABLE_CORNERS.apex.z), point(GABLE_CORNERS.rightFoot.x, mFront(GABLE_CORNERS.rightFoot.z), GABLE_CORNERS.rightFoot.z)),
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
 * @evidence spaces/roof/00-junctions.md This classification follows the roof parts' shared ridge and valley coordinates.
 * @evidence principles/core/source-units.md#source-scope-preservation The rule selects closure of authored edges without changing roof mass.
 * @evidence principles/core/source-units.md#source-substantive-completion A free step or chimney edge receives a thickness face, while paired weather edges remain open.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The shared roof design already distinguishes coincident ridge and valley edges from free outline.
 */
export const roofFreeEdge = (a: IAutoMovieVector3, b: IAutoMovieVector3): boolean =>
  !shared.some((edge) => onSegment(a, edge) && onSegment(b, edge));

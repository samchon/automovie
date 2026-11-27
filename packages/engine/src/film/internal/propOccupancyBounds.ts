import {
  IAutoMoviePropBox,
  type IAutoMoviePropOccupancyBounds,
} from "@automovie/interface";

import { builtPlacedPartBoxes } from "../../architecture/internal/builtPlacedPartBoxes";
import { transformedBoxBounds } from "../../math/internal/transformedBoxBounds";
import { setPieceMatrix } from "../staging/internal/setPieceMatrix";
import { unionSubjectBoxes } from "./unionSubjectBoxes";

/**
 * The world-axis-aligned volume one staged prop occupies.
 *
 * A declared `placement.footprint` wins because it is the prop's own statement
 * of what it takes up; otherwise the bound is derived from the prop's own model
 * parts, each placed under its part transform and read through `tessellate` for
 * a primitive. Either way the volume travels through the piece's full staged
 * transform before the world bound is taken, so a rotated prop widens rather
 * than being re-fitted to its local box.
 *
 * Those parts are the prop's geometry, not necessarily what a viewer draws. A
 * prop citing an external appearance keeps its registered deterministic proxy;
 * this engine query does not open imported asset bytes. An explicit footprint
 * states the use volume when the proxy is too crude. If no part carries a
 * vertex, builtPlacedPartBoxes returns a zero box at the staged piece's world
 * origin.
 *
 * @param props.prop The prop's registry entry.
 * @param props.piece The set piece that stages it.
 * @returns A new world box in metres.
 */
export function propOccupancyBounds(
  props: IAutoMoviePropOccupancyBounds.IProps,
): IAutoMoviePropBox {
  const matrix: number[] = setPieceMatrix(props.piece);
  const footprint: IAutoMoviePropBox | null =
    props.prop.placement?.footprint ?? null;
  if (footprint !== null) return transformedBoxBounds(footprint, matrix);
  return unionSubjectBoxes(builtPlacedPartBoxes(props.prop.model, matrix))!;
}

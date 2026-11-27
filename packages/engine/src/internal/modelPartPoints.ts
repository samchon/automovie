import {
  IAutoMovieModel,
  IAutoMovieModelPart,
  type IAutoMovieModelPartPoints,
  IAutoMovieVector3,
} from "@automovie/interface";

import { modelPartMatrices } from "./modelPartMatrices";
import { transformDrawingPoint } from "../drawing/internal/transformDrawingPoint";
import { realizeGeometry } from "../geometry/internal/realizeGeometry";
import { AutoMovieEngineMatrix4 } from "../math/AutoMovieEngineMatrix4";

/*
 * Every vertex of every part of one model, placed in the model's own frame.
 *
 * A primitive part is tessellated by the engine's kernel and a mesh part read
 * as stated; each vertex is moved by the part's own transform and, for a part
 * attached to a bone of the model's skeleton, then by that bone's world rest
 * placement (position and rotation, unit scale). A bone the rest pose does not
 * resolve leaves its parts unattached. Positions are read as whole `x, y, z`
 * triples and a trailing partial triple is ignored. Units are model metres.
 *
 * The rest pose is resolved at most once per call, on the first attached part.
 * `parts` is keyed by the part objects of `model.parts`, in part order, and
 * `all` holds every part's points concatenated in that order.
 * Parameter model: Model whose parts are placed.
 * Returns: Each part's model-frame points, and all of them together.
 */
export function modelPartPoints(
  model: IAutoMovieModel,
): IAutoMovieModelPartPoints.IResult {
  const matrices: Map<IAutoMovieModelPart, number[] | null> =
    modelPartMatrices(model);
  const parts: Map<IAutoMovieModelPart, IAutoMovieVector3[]> = new Map();
  const all: IAutoMovieVector3[] = [];
  for (const part of model.parts) {
    const positions: readonly number[] = realizeGeometry(part.geometry)
      .mesh.positions;
    const matrix: number[] = matrices.get(part) ?? AutoMovieEngineMatrix4.identity();
    const points: IAutoMovieVector3[] = [];
    for (let index: number = 0; index + 2 < positions.length; index += 3) {
      const point: IAutoMovieVector3 = transformDrawingPoint(matrix, {
        x: positions[index]!,
        y: positions[index + 1]!,
        z: positions[index + 2]!,
      });
      points.push(point);
      all.push(point);
    }
    parts.set(part, points);
  }
  return { parts, all };
}

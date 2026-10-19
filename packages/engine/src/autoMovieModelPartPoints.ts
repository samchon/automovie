import {
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { autoMovieModelPartMatrices } from "./autoMovieModelPartMatrices";
import { transformAutoMovieDrawingPoint } from "./drawing/transformAutoMovieDrawingPoint";
import { realizeAutoMovieGeometry } from "./geometry/realizeAutoMovieGeometry";
import { Matrix4 } from "./math/Matrix4";

/**
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
 *
 * @param model Model whose parts are placed.
 * @returns Each part's model-frame points, and all of them together.
 *
 * @evidence contracts/common.md#principled-implementation Moves every vertex by the part-to-model matrix of `autoMovieModelPartMatrices`, the part TRS pre-multiplied by an attached bone's rest world placement, with an identity for an unplaced part.
 * @evidence contracts/common.md#clear-and-simple-design One owner of model-frame part points for subject description, reusing the shared placement matrices, the engine tessellator and the shared affine point transform.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No model, part or bone is special-cased; an unresolved bone is left unattached by the stated rule instead of being guessed.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the per-part placement order, the bone rule and its failure case, the partial-triple rule, the units, that the pose is resolved at most once, and the keys and order of both results.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the model's vertices plus at most one rest-pose resolution and one tessellation per primitive part; the rest pose is resolved only when a part is attached and is then shared by every attached part.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Recomputed per call from the given model; the subject describer memoizes the result per model for one description pass, because the artifact is the caller's value.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The resolved pose and tessellations are released on return; the caller owns the returned map and list, each bounded by the model's vertex count and sharing the same point objects.
 */
export const autoMovieModelPartPoints: (model: IAutoMovieModel) => {
  parts: Map<IAutoMovieModelPart, IAutoMovieVector3[]>;
  all: IAutoMovieVector3[];
} = (
  model: IAutoMovieModel,
): {
  parts: Map<IAutoMovieModelPart, IAutoMovieVector3[]>;
  all: IAutoMovieVector3[];
} => {
  const matrices: Map<IAutoMovieModelPart, number[] | null> =
    autoMovieModelPartMatrices(model);
  const parts: Map<IAutoMovieModelPart, IAutoMovieVector3[]> = new Map();
  const all: IAutoMovieVector3[] = [];
  for (const part of model.parts) {
    const positions: readonly number[] = realizeAutoMovieGeometry(part.geometry)
      .mesh.positions;
    const matrix: number[] = matrices.get(part) ?? Matrix4.identity();
    const points: IAutoMovieVector3[] = [];
    for (let index: number = 0; index + 2 < positions.length; index += 3) {
      const point: IAutoMovieVector3 = transformAutoMovieDrawingPoint(matrix, {
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
};

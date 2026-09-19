import { IAutoMovieModel, IAutoMovieModelPart, IAutoMovieVector3 } from "@automovie/interface";
import { tessellate } from "../geometry/tessellate";
import { Matrix4 } from "../math/Matrix4";
import { IAutoMovieDrawingTriangle } from "./IAutoMovieDrawingTriangle";
import { transformAutoMovieDrawingPoint } from "./transformAutoMovieDrawingPoint";

/**
 * Triangles of one model part, in the part's own frame.
 *
 * A primitive is tessellated by the engine's own kernel, so the drawing and the
 * renderer read one description of a box. An imported mesh is taken as written.
 * Malformed arrays throw: a triangle list that is not a multiple of three is an
 * authoring defect, and drawing whatever prefix happens to divide evenly would
 * hide it behind a plausible-looking outline.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Extracts the actual triangles of one model part so its drawing linework comes from the same authored geometry as the staged object.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Tessellates primitives or reads mesh indices, rejects malformed arrays, and applies the part-local transform to every resulting facet.
 */
export const autoMovieDrawingPartTriangles = (
  model: IAutoMovieModel,
  part: IAutoMovieModelPart,
): IAutoMovieDrawingTriangle[] => {
  const source =
    part.geometry.type === "primitive"
      ? tessellate(part.geometry.shape)
      : part.geometry.mesh;
  const positions = source.positions;
  const indices =
    source.indices ??
    Array.from({ length: positions.length / 3 }, (_, index) => index);
  if (positions.length % 3 !== 0)
    throw new Error(
      `model "${model.id}" part "${part.id}" has ${positions.length} position scalars, which is not a multiple of 3`,
    );
  if (indices.length % 3 !== 0)
    throw new Error(
      `model "${model.id}" part "${part.id}" has ${indices.length} indices, which is not a multiple of 3`,
    );
  const vertexCount = positions.length / 3;
  const corner = (index: number): IAutoMovieVector3 => {
    if (!Number.isInteger(index) || index < 0 || index >= vertexCount)
      throw new Error(
        `model "${model.id}" part "${part.id}" index ${index} is outside its ${vertexCount} vertices`,
      );
    return {
      x: positions[index * 3]!,
      y: positions[index * 3 + 1]!,
      z: positions[index * 3 + 2]!,
    };
  };
  const local = part.transform;
  const matrix =
    local === null
      ? null
      : Matrix4.compose(local.translation, local.rotation, local.scale);
  const place = (point: IAutoMovieVector3): IAutoMovieVector3 =>
    matrix === null ? point : transformAutoMovieDrawingPoint(matrix, point);
  const triangles: IAutoMovieDrawingTriangle[] = [];
  for (let index = 0; index + 2 < indices.length; index += 3)
    triangles.push({
      a: place(corner(indices[index]!)),
      b: place(corner(indices[index + 1]!)),
      c: place(corner(indices[index + 2]!)),
    });
  return triangles;
};

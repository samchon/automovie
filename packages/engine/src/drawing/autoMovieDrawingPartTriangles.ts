import {
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { realizeAutoMovieGeometry } from "../geometry/realizeAutoMovieGeometry";
import { Matrix4 } from "../math/Matrix4";
import { IAutoMovieDrawingTriangle } from "./IAutoMovieDrawingTriangle";
import { transformAutoMovieDrawingPoint } from "./transformAutoMovieDrawingPoint";

/**
 * Triangles of one model part in the model's frame, with the part's own
 * transform applied.
 *
 * A primitive is tessellated by the engine's own kernel, so the drawing and
 * the renderer read one description of a box. An imported mesh is taken as
 * written, indexed or not, and its winding is kept because the silhouette pass
 * reads it. Bicubic recipes use the same canonical engine realization as display,
 * including finite partial output; processing qualification is not a drawing gate.
 *
 * Throws an `Error` naming the model and part when the position array is not
 * whole `x, y, z` triples, the index array is not whole triangles, or an index
 * is not an integer naming one of the vertices: drawing whatever prefix
 * happens to divide evenly would hide an authoring defect behind a plausible
 * outline.
 *
 * @param model Model owning the part; used for its id in failures.
 * @param part Part whose geometry and transform are read.
 * @returns The part's triangles in model-frame metres.
 *
 * @evidence contracts/common.md#principled-implementation Reads the mesh's flat position and index arrays as the glTF-style triangle list they are, composing the part's TRS with `Matrix4.compose` as the renderer does; the premises are a whole-triple position array and in-range integer indices, which this function checks before reading any corner.
 * @evidence contracts/common.md#clear-and-simple-design One function turns a part record into triangles for every drawing consumer, delegating recipe realization to realizeAutoMovieGeometry and point placement to transformAutoMovieDrawingPoint.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No model, part or primitive is special-cased; malformed arrays throw instead of being truncated to the prefix that divides evenly.
 * @evidence contracts/common.md#meaningful-documentation The comment states the output frame, the primitive and imported-mesh sources, that winding is kept and why, every refused input and the failure type.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the vertex and index counts: one tessellation for a primitive, one pass over the indices, and a fresh index list only for an unindexed mesh, whose order defines its triangles.
 * @evidence contracts/performance.md#reuse-equivalent-work Pure in its arguments, so it caches nothing itself; `indexAutoMovieDrawingDesign` memoizes its result per part object for one derivation, so a model placed many times is tessellated once.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a fresh array owned by the caller; the tessellated mesh and index list are temporaries released when the call returns.
 */
export const autoMovieDrawingPartTriangles: (
  model: IAutoMovieModel,
  part: IAutoMovieModelPart,
) => IAutoMovieDrawingTriangle[] = (
  model: IAutoMovieModel,
  part: IAutoMovieModelPart,
): IAutoMovieDrawingTriangle[] => {
  const source: IAutoMovieMesh = realizeAutoMovieGeometry(part.geometry).mesh;
  const positions: readonly number[] = source.positions;
  if (positions.length % 3 !== 0)
    throw new Error(
      `model "${model.id}" part "${part.id}" has ${positions.length} position scalars, which is not a multiple of 3`,
    );
  const vertexCount: number = positions.length / 3;
  const indices: readonly number[] =
    source.indices ??
    Array.from(
      { length: vertexCount },
      (_: unknown, index: number): number => index,
    );
  if (indices.length % 3 !== 0)
    throw new Error(
      `model "${model.id}" part "${part.id}" has ${indices.length} indices, which is not a multiple of 3`,
    );
  const corner: (index: number) => IAutoMovieVector3 = (
    index: number,
  ): IAutoMovieVector3 => {
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
  const matrix: number[] | null =
    part.transform === null
      ? null
      : Matrix4.compose(
          part.transform.translation,
          part.transform.rotation,
          part.transform.scale,
        );
  const place: (point: IAutoMovieVector3) => IAutoMovieVector3 = (
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    matrix === null ? point : transformAutoMovieDrawingPoint(matrix, point);
  const triangles: IAutoMovieDrawingTriangle[] = [];
  for (let index: number = 0; index < indices.length; index += 3)
    triangles.push({
      a: place(corner(indices[index]!)),
      b: place(corner(indices[index + 1]!)),
      c: place(corner(indices[index + 2]!)),
    });
  return triangles;
};

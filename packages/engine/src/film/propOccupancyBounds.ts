import { IAutoMovieModel, IAutoMoviePropBox, IAutoMoviePropSpec, IAutoMovieStageSetPiece, IAutoMovieVector3 } from "@automovie/interface";
import { tessellate } from "../geometry/tessellate";
import { Matrix4 } from "../math/Matrix4";
import { Quaternion } from "../math/Quaternion";

/**
 * The world-axis-aligned volume one staged prop occupies.
 *
 * A declared `footprint` wins because it is the prop's own statement of what it
 * takes up; otherwise the bound is derived from the prop's own parts, which is
 * the only honest answer a prop that says nothing can be given. Either way all
 * eight corners travel through the piece's full TRS (translation, unit
 * quaternion, per-axis scale) before the world bound is taken, so a rotated
 * prop widens rather than being silently re-fitted to its local box.
 *
 * Those parts are the prop's geometry, not necessarily what a viewer draws. A
 * prop citing an external appearance (`IAutoMoviePropSpec.modelRef`) keeps its
 * parts as the deterministic proxy the builder registered, and that proxy is
 * what is measured here, because it is the only volume anybody stated: the
 * imported bytes are a file the engine never opens. So an author whose proxy is
 * cruder than the mesh it stands for declares a `footprint` for exactly the
 * reason a generated prop does, to state a use volume the geometry does not
 * show.
 *
 * A prop whose parts carry no vertices at all collapses to the staged origin
 * rather than to an empty bound, so a caller never has to special-case it.
 *
 * @evidence requirements/interior/furniture-fixtures-and-equipment.md#interior-object-use-clearance propOccupancyBounds transforms the prop body into the world volume used to test occupied circulation space.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-furniture-fixture-equipment-placement propOccupancyBounds realizes furnishing placement clearance: The world-axis-aligned volume one staged prop occupies. A declared `footprint` wins because it is the prop's own statement of what it takes up; otherwise the bound is derived from the prop's own parts, which is the only honest answer a prop that says nothing can be given. Either way all eight corners travel through the piece's full TRS (translation, unit quaternion, per-axis scale) before the world bound is taken, so a rotated prop widens rather than being silently re-fitted to its local box. Those parts are the prop's geometry, not necessarily what a viewer draws. A prop citing an external appearance (`IAutoMoviePropSpec.modelRef`) keeps its parts as the deterministic proxy the builder registered, and that proxy is what is measured here, because it is the only volume anybody stated: the imported bytes are a file the engine never opens. So an author whose proxy is cruder than the mesh it stands for declares a `footprint` for exactly the reason a generated prop does, to state a use volume the geometry does not show. A prop whose parts carry no vertices at all collapses to the staged origin rather than to an empty bound, so a caller never has to special-case it.
 */
export const propOccupancyBounds = (props: {
  prop: IAutoMoviePropSpec;
  piece: IAutoMovieStageSetPiece;
}): IAutoMoviePropBox => {
  const matrix = stagedMatrix(props.piece);
  const footprint = props.prop.placement?.footprint ?? null;
  if (footprint !== null) return transformedBox(footprint, matrix);
  return transformedModelBounds(props.prop.model, matrix);
};

const stagedMatrix = (piece: IAutoMovieStageSetPiece): number[] => {
  const scale =
    piece.scale === undefined
      ? { x: 1, y: 1, z: 1 }
      : typeof piece.scale === "number"
        ? { x: piece.scale, y: piece.scale, z: piece.scale }
        : piece.scale;
  return Matrix4.compose(
    piece.position,
    piece.rotation ??
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, piece.facingDeg ?? 0),
    scale,
  );
};

const transformedModelBounds = (
  model: IAutoMovieModel,
  world: number[],
): IAutoMoviePropBox => {
  const points: IAutoMovieVector3[] = [];
  for (const part of model.parts) {
    const positions =
      part.geometry.type === "primitive"
        ? tessellate(part.geometry.shape).positions
        : part.geometry.mesh.positions;
    const matrix =
      part.transform === null
        ? world
        : Matrix4.multiply(
            world,
            Matrix4.compose(
              part.transform.translation,
              part.transform.rotation,
              part.transform.scale,
            ),
          );
    for (let index = 0; index < positions.length; index += 3)
      points.push(
        transformPoint(
          {
            x: positions[index]!,
            y: positions[index + 1]!,
            z: positions[index + 2]!,
          },
          matrix,
        ),
      );
  }
  if (points.length === 0) {
    const origin = Matrix4.position(world);
    return { min: { ...origin }, max: { ...origin } };
  }
  return boundsOf(points);
};

const transformedBox = (
  box: IAutoMoviePropBox,
  matrix: number[],
): IAutoMoviePropBox =>
  boundsOf(boxCorners(box).map((point) => transformPoint(point, matrix)));

const boxCorners = (box: IAutoMoviePropBox): IAutoMovieVector3[] =>
  [box.min.x, box.max.x].flatMap((x) =>
    [box.min.y, box.max.y].flatMap((y) =>
      [box.min.z, box.max.z].map((z) => ({ x, y, z })),
    ),
  );

const transformPoint = (
  point: IAutoMovieVector3,
  matrix: number[],
): IAutoMovieVector3 => ({
  x:
    matrix[0]! * point.x +
    matrix[4]! * point.y +
    matrix[8]! * point.z +
    matrix[12]!,
  y:
    matrix[1]! * point.x +
    matrix[5]! * point.y +
    matrix[9]! * point.z +
    matrix[13]!,
  z:
    matrix[2]! * point.x +
    matrix[6]! * point.y +
    matrix[10]! * point.z +
    matrix[14]!,
});

const boundsOf = (points: readonly IAutoMovieVector3[]): IAutoMoviePropBox => {
  const first = points[0]!;
  const bounds: IAutoMoviePropBox = {
    min: { ...first },
    max: { ...first },
  };
  for (const point of points.slice(1)) {
    bounds.min.x = Math.min(bounds.min.x, point.x);
    bounds.min.y = Math.min(bounds.min.y, point.y);
    bounds.min.z = Math.min(bounds.min.z, point.z);
    bounds.max.x = Math.max(bounds.max.x, point.x);
    bounds.max.y = Math.max(bounds.max.y, point.y);
    bounds.max.z = Math.max(bounds.max.z, point.z);
  }
  return bounds;
};

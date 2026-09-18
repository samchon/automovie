import { IAutoMoviePropBox, IAutoMoviePropSpec, IAutoMovieStageSetPiece, IAutoMovieVector3 } from "@automovie/interface";
import { Matrix4 } from "../math/Matrix4";
import { Quaternion } from "../math/Quaternion";
import { IAutoMoviePropClearanceBounds } from "./IAutoMoviePropClearanceBounds";

/**
 * The world-axis-aligned keep-out volumes one staged prop declares.
 *
 * Every declared box is transformed, including one whose bounds the validator
 * rejects: filtering here would hide a malformed volume from a source-side
 * search instead of letting the validator name it.
 *
 * @evidence requirements/interior/furniture-fixtures-and-equipment.md#interior-object-use-clearance propClearanceBounds transforms each declared use envelope into a world keep-out volume for placement validation.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-furniture-fixture-equipment-placement propClearanceBounds realizes furnishing placement clearance: The world-axis-aligned keep-out volumes one staged prop declares. Every declared box is transformed, including one whose bounds the validator rejects: filtering here would hide a malformed volume from a source-side search instead of letting the validator name it.
 */
export const propClearanceBounds = (props: {
  prop: IAutoMoviePropSpec;
  piece: IAutoMovieStageSetPiece;
}): IAutoMoviePropClearanceBounds[] => {
  const matrix = stagedMatrix(props.piece);
  return (props.prop.placement?.clearance ?? []).map((clearance) => ({
    id: clearance.id,
    ...transformedBox(clearance, matrix),
  }));
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

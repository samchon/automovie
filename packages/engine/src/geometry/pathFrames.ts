/**
 * Transport section frames along the polyline used by sweep and loft.
 * Path points remain caller-owned and use metres. Each tangent is normalized;
 * a degenerate local span is refused. Seed a deterministic perpendicular axis,
 * then use shortest-arc rotation to carry the previous right vector through
 * bends. Re-orthogonalization precedes returning each new frame. Changing this
 * convention rotates every swept section and its authored texture coordinates.
 */
import { IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { rotationBetween } from "../math/rotationBetween";

const tangentAt = (
  path: readonly IAutoMovieVector3[],
  index: number,
  label: string,
): IAutoMovieVector3 => {
  const from = index === 0 ? path[0]! : path[index - 1]!;
  const to = index + 1 === path.length ? path[index]! : path[index + 1]!;
  const delta = Vector3.subtract(to, from);
  if (Vector3.length(delta) <= Number.EPSILON)
    throw new Error(`${label} around point ${index} is degenerate`);
  return Vector3.normalize(delta);
};

interface IPathFrame {
  tangent: IAutoMovieVector3;
  right: IAutoMovieVector3;
  up: IAutoMovieVector3;
}

/** Seed one frame, then transport it without introducing axis-switch twists.
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Places repeated construction sections along a three-dimensional path.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Transports orthonormal section frames using successive tangents and shortest-arc rotation.
 */
export const pathFrames = (
  path: readonly IAutoMovieVector3[],
  label: string,
): IPathFrame[] => {
  let previous: IPathFrame | undefined;
  return path.map((_, index) => {
    const tangent = tangentAt(path, index, label);
    const transported =
      previous === undefined
        ? Vector3.cross(
            Math.abs(tangent.y) < 0.9
              ? { x: 0, y: 1, z: 0 }
              : { x: 1, y: 0, z: 0 },
            tangent,
          )
        : Quaternion.rotateVector(
            rotationBetween(previous.tangent, tangent),
            previous.right,
          );
    const up = Vector3.normalize(Vector3.cross(tangent, transported));
    const right = Vector3.normalize(Vector3.cross(up, tangent));
    const frame = { tangent, right, up };
    previous = frame;
    return frame;
  });
};

import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { rotationBetween } from "../math/rotationBetween";
import { IAutoMoviePathSectionFrame } from "./IAutoMoviePathSectionFrame";

/**
 * Compute the section frame at every point of a sweep or loft path by
 * parallel transport, so a section does not twist where the path bends.
 *
 * The tangent at a point is the normalized chord to its neighbours: central
 * for interior points, one-sided at the ends. The first frame seeds its right
 * axis from world up crossed with the tangent, or from world X when the
 * tangent is within about 26 degrees of vertical; every later right axis is
 * the previous one rotated by the shortest arc between consecutive tangents,
 * then re-orthogonalized. Path points are caller-owned metres and only read.
 *
 * Changing this convention rotates every swept section and its texture
 * coordinates. Throws, naming `label` and the point, when a tangent chord is
 * no longer than `Number.EPSILON`, which happens when a point repeats its
 * neighbour.
 *
 * @param path At least two path points in metres.
 * @param label Name of the path in diagnostics.
 * @returns One frame per path point, in order.
 *
 * @evidence contracts/common.md#principled-implementation Discrete parallel transport (rotation-minimizing frames): carrying the previous right axis by the minimal rotation between tangents adds no rotation about the tangent itself, so the section neither twists nor flips the way an axis-switching Frenet or fixed-up frame does at inflections and vertical runs.
 * @evidence contracts/common.md#clear-and-simple-design One frame convention shared by `sweepAutoMovieProfile` and `loftAutoMovieSections`, so a constant section lofted along a path lands exactly where the sweep would place it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 0.9 seed threshold only picks a well-conditioned reference axis for the first frame and never reorients later frames; a degenerate tangent throws instead of reusing the previous one.
 * @evidence contracts/common.md#meaningful-documentation States the tangent rule, the seed rule and its threshold, the transport, the ownership and unit, what a change would break, and the refusal.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the path length: one tangent, one shortest-arc rotation and three cross products per point.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each sweep or loft computes its own path's frames once and reads them for every section point.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one owned frame of three vectors per path point and keeps only the previous frame while iterating.
 * @author Samchon
 */
export const pathFrames = (
  path: readonly IAutoMovieVector3[],
  label: string,
): IAutoMoviePathSectionFrame[] => {
  let previous: IAutoMoviePathSectionFrame | undefined;
  return path.map(
    (_point: IAutoMovieVector3, index: number): IAutoMoviePathSectionFrame => {
      const tangent: IAutoMovieVector3 = tangentAt(path, index, label);
      let transported: IAutoMovieVector3;
      if (previous === undefined)
        transported = Vector3.cross(
          Math.abs(tangent.y) < 0.9
            ? { x: 0, y: 1, z: 0 }
            : { x: 1, y: 0, z: 0 },
          tangent,
        );
      else {
        const rotation: IAutoMovieQuaternion = rotationBetween(
          previous.tangent,
          tangent,
        );
        transported = Quaternion.rotateVector(rotation, previous.right);
      }
      const up: IAutoMovieVector3 = Vector3.normalize(
        Vector3.cross(tangent, transported),
      );
      const right: IAutoMovieVector3 = Vector3.normalize(
        Vector3.cross(up, tangent),
      );
      const frame: IAutoMoviePathSectionFrame = { tangent, right, up };
      previous = frame;
      return frame;
    },
  );
};

/** The normalized chord through a path point's neighbours. */
const tangentAt = (
  path: readonly IAutoMovieVector3[],
  index: number,
  label: string,
): IAutoMovieVector3 => {
  const from: IAutoMovieVector3 = index === 0 ? path[0]! : path[index - 1]!;
  const to: IAutoMovieVector3 =
    index + 1 === path.length ? path[index]! : path[index + 1]!;
  const delta: IAutoMovieVector3 = Vector3.subtract(to, from);
  if (Vector3.length(delta) <= Number.EPSILON)
    throw new Error(`${label} around point ${index} is degenerate`);
  return Vector3.normalize(delta);
};

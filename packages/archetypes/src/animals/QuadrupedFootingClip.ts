import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "../core";
import type { AutoMovieArchetypeQuadrupedFooting } from "./AutoMovieArchetypeQuadrupedFooting";
import { QuadrupedRestFloor } from "./QuadrupedRestFloor";

/**
 * The lowest height above a plane, in the plane's own frame, of a part's surface points that lie over the plane's rectangle. A bar straddling a seam between two planes is therefore judged only by its points above each plane, not by its lowest point anywhere.
 *
 * Cylinders, capsules and spheres are sampled at 17 sections by 16 directions, plus the capsule's poles, so a penetration shallower than about 2 % of the radius can pass. Other solids return their exact global lowest point, which is conservative.
 *
 * @param part The part with its world transform.
 * @param plane The plane, for its world rectangle.
 * @param frame The world-to-plane frame, whose Y is the height above the plane.
 * @returns Metres; Infinity when no sampled point lies over the rectangle.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frames, the sampling resolution and the conservative fallback.
 * @evidence contracts/development/implementation.md#principled-implementation A surface point penetrates a plane only where it lies over the plane's extent; the round solids' surfaces are their axis sections swept by the radius.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Sample, keep the points over the rectangle, take the least height.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The sampling's resolution is stated; other solids keep the exact conservative test.
 * @evidence contracts/development/implementation.md#efficient-algorithms 274 points per round part, and only for a part the global test already flags.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the plane frame and the exact floor reader.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one number.
 */
export function QuadrupedFootingClip(
  part: IAutoMovieModelPart,
  plane: AutoMovieArchetypeQuadrupedFooting.IPlane,
  frame: IAutoMovieTransform,
): number {
  const shape: IAutoMovieModelPart["geometry"] = part.geometry;
  if (
    shape.type !== "primitive" ||
    (shape.shape.type !== "cylinder" &&
      shape.shape.type !== "capsule" &&
      shape.shape.type !== "sphere")
  )
    return QuadrupedRestFloor({
      ...part,
      transform: AutoMovieArchetypeFrame.compose(frame, part.transform!),
    });
  const radius: number = shape.shape.radius;
  const half: number =
    shape.shape.type === "sphere" ? 0 : shape.shape.height / 2;
  const centre: IAutoMovieVector3 = part.transform!.translation;
  const rotation: IAutoMovieQuaternion = part.transform!.rotation;
  const axis: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
    x: 0,
    y: 1,
    z: 0,
  });
  const u: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
    x: 1,
    y: 0,
    z: 0,
  });
  const v: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
    x: 0,
    y: 0,
    z: 1,
  });
  const points: IAutoMovieVector3[] = [];
  for (let i: number = 0; i <= 16; i++) {
    const along: IAutoMovieVector3 = Vector3.add(
      centre,
      Vector3.scale(axis, -half + (2 * half * i) / 16),
    );
    for (let k: number = 0; k < 16; k++) {
      const angle: number = (2 * Math.PI * k) / 16;
      points.push(
        Vector3.add(
          along,
          Vector3.add(
            Vector3.scale(u, radius * Math.cos(angle)),
            Vector3.scale(v, radius * Math.sin(angle)),
          ),
        ),
      );
    }
  }
  if (shape.shape.type !== "cylinder")
    for (const sign of [-1, 1])
      points.push(
        Vector3.add(centre, Vector3.scale(axis, sign * (half + radius))),
      );
  let least: number = Infinity;
  for (const point of points)
    if (
      point.x >= plane.x[0] &&
      point.x < plane.x[1] &&
      point.z >= plane.z[0] &&
      point.z < plane.z[1]
    )
      least = Math.min(least, AutoMovieArchetypeFrame.point(frame, point).y);
  return least;
}

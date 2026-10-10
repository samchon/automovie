import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The midpoint of the body's two eye joints, the anchor of the face basis's
 * eye-centred frame, read from a landmark table by id.
 *
 * Refuses a table without `joint-l-eye` and `joint-r-eye`.
 */
export function humanPersonEyeCentre(
  landmarks: Readonly<Record<string, IAutoMovieVector3>>,
): IAutoMovieVector3 {
  const left = landmarks["joint-l-eye"];
  const right = landmarks["joint-r-eye"];
  if (left === undefined || right === undefined)
    throw new Error(
      "The person head carry needs the body's joint-l-eye and joint-r-eye landmarks.",
    );
  return {
    x: (left.x + right.x) / 2,
    y: (left.y + right.y) / 2,
    z: (left.z + right.z) / 2,
  };
}

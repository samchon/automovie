import { interpolateHumanBasisSourceTriangle } from "../../common/basis/interpolateHumanBasisSourceTriangle";
import type { IAutoMovieHumanFaceSourcePosePlan } from "../structures/IAutoMovieHumanFaceSourcePosePlan";

/**
 * Replay compiled face refinement samples after the original vertices pose.
 * A barycentric point on a performed triangle follows that triangle, rather
 * than independently skinning an interpolated position and attachment weight:
 * those two operations do not commute when the corners have different owners.
 * Existing original and frozen neck-cut samples remain where their owner put
 * them. Only the appended triangle refinements are evaluated here.
 *
 * Positions and the result use the caller's common metre/head frame. The
 * pose plan carries dimensionless identities and coordinates, not anatomy.
 * Every refinement needs its three native parent corners resident in this
 * surface. Exact-corner aliases must agree before refinement; a missing
 * corner, inconsistent alias or unsupported sample refuses without changing
 * supplied arrays. The source compiler and closure owner still own the joined
 * geometry, contact, attributes and final observation.
 */
export function replayHumanFaceSourceRefinements(
  plan: IAutoMovieHumanFaceSourcePosePlan | undefined,
  positions: readonly number[],
): number[] {
  const output = positions.slice();
  if (plan === undefined) return output;
  if (plan.generation.trim() === "")
    throw new Error("Face source pose plan needs its compiler generation.");
  if (
    !Number.isSafeInteger(plan.nativeVertices) ||
    plan.nativeVertices < 3 ||
    positions.length !== (plan.nativeVertices + plan.samples.length) * 3
  )
    throw new Error(
      "Face source pose plan needs matching native and derived positions.",
    );
  if (
    plan.nativeTriangles.length === 0 ||
    plan.nativeTriangles.length % 3 !== 0
  )
    throw new Error(
      "Face source pose parents must reference only its native prefix.",
    );
  for (let at = 0; at < plan.nativeTriangles.length; at += 3) {
    const ids = [
      plan.nativeTriangles[at],
      plan.nativeTriangles[at + 1],
      plan.nativeTriangles[at + 2],
    ];
    if (
      ids.some(
        (v) => !Number.isSafeInteger(v) || v < 0 || v >= plan.nativeVertices,
      ) ||
      new Set(ids).size !== 3
    )
      throw new Error(
        "Face source pose parents need three distinct native prefix corners.",
      );
  }
  for (let index = 0; index < positions.length; index++)
    if (!Number.isFinite(positions[index]))
      throw new Error(
        "Face source pose inputs need finite corner and derived coordinates.",
      );
  for (let index = 0; index < plan.samples.length; index++) {
    const sample = plan.samples[index];
    if (
      sample === undefined ||
      !Number.isSafeInteger(sample.parent) ||
      sample.parent < 0 ||
      sample.parent >= plan.nativeTriangles.length / 3
    )
      throw new Error("Face source pose sample names an absent native parent.");
    const ids = plan.nativeTriangles.slice(
      sample.parent * 3,
      sample.parent * 3 + 3,
    );
    const point = [0, 1, 2].map((axis) =>
      interpolateHumanBasisSourceTriangle(
        [
          positions[ids[0] * 3 + axis],
          positions[ids[1] * 3 + axis],
          positions[ids[2] * 3 + axis],
        ],
        sample.coordinates,
      ),
    );
    const [u, v] = sample.coordinates;
    const corner =
      u === 0 && v === 0
        ? ids[0]
        : u === 1
          ? ids[1]
          : v === 1
            ? ids[2]
            : undefined;
    const vertex = plan.nativeVertices + index;
    if (
      corner !== undefined &&
      point.some((one, axis) => one !== positions[vertex * 3 + axis])
    )
      throw new Error("Face source alias disagrees after native posing.");
    for (let axis = 0; axis < 3; axis++)
      output[vertex * 3 + axis] = point[axis];
  }
  return output;
}

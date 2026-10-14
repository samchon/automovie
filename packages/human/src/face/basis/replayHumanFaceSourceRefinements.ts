import { interpolateHumanBasisSourceTriangle } from "../../common/basis/interpolateHumanBasisSourceTriangle";
import type { IAutoMovieHumanFaceSourcePosePlan } from "../structures/IAutoMovieHumanFaceSourcePosePlan";
import type { IAutoMovieHumanBasisSourceChartPoint as IAutoMovieHumanBasisSourceChartPointImported } from "../../common/basis/IAutoMovieHumanBasisSourceChartPoint";


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
 *
 * @evidence contracts/common.md#principled-implementation Appended samples interpolate their three performed native parent corners through the shared exact-coordinate source owner, because interpolating after pose differs from independently skinning a preinterpolated sample. Frozen original/cut points remain unchanged and exact-corner aliases must agree.
 * @evidence contracts/common.md#clear-and-simple-design This replay owns only compiled refinement coordinates; source compilation, attachments, physical correspondence and final admission remain with their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing generation/layout/native parents, nonfinite coordinates or inconsistent aliases refuse. No projection, coordinate welding, new source point or contact repair substitutes for persisted parent support.
 * @evidence contracts/common.md#meaningful-documentation Prose states common metre/head frame, dimensionless pose-plan support, noncommuting pose/interpolation and fresh output with unchanged supplied arrays.
 * @evidence contracts/performance.md#efficient-algorithms Work copies/scans V coordinates, validates T native triangle entries and evaluates S appended samples through the source fraction conversion; bigint operand cost remains with that owner. Even a small S still pays the complete native admission scans.
 * @evidence contracts/performance.md#reuse-equivalent-work One copied output receives each derived sample once and all consumers use the shared interpolation formula; changing performed parent positions requires replay, so no stale posed-coordinate cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The fresh O(V) output transfers on success; parent/small-point temporaries remain local and failures expose no partially mutated input or external handle.
 */
export function replayHumanFaceSourceRefinements(
  plan: IAutoMovieHumanFaceSourcePosePlan | undefined,
  positions: readonly number[],
): number[] {
  const output: number[] = positions.slice();
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
  for (let at: number = 0; at < plan.nativeTriangles.length; at += 3) {
    const ids: number[] = [
      plan.nativeTriangles[at],
      plan.nativeTriangles[at + 1],
      plan.nativeTriangles[at + 2],
    ];
    if (
      ids.some(
        (v: number): boolean  => !Number.isSafeInteger(v) || v < 0 || v >= plan.nativeVertices,
      ) ||
      new Set(ids).size !== 3
    )
      throw new Error(
        "Face source pose parents need three distinct native prefix corners.",
      );
  }
  for (let index: number = 0; index < positions.length; index++)
    if (!Number.isFinite(positions[index]))
      throw new Error(
        "Face source pose inputs need finite corner and derived coordinates.",
      );
  for (let index: number = 0; index < plan.samples.length; index++) {
    const sample: IAutoMovieHumanBasisSourceChartPointImported = plan.samples[index];
    if (
      sample === undefined ||
      !Number.isSafeInteger(sample.parent) ||
      sample.parent < 0 ||
      sample.parent >= plan.nativeTriangles.length / 3
    )
      throw new Error("Face source pose sample names an absent native parent.");
    const ids: number[] = plan.nativeTriangles.slice(
      sample.parent * 3,
      sample.parent * 3 + 3,
    );
    const point: number[] = [0, 1, 2].map((axis: number): number  =>
      interpolateHumanBasisSourceTriangle(
        [
          positions[ids[0] * 3 + axis],
          positions[ids[1] * 3 + axis],
          positions[ids[2] * 3 + axis],
        ],
        sample.coordinates,
      ),
    );
    const [u, v]: readonly [number, number] = sample.coordinates;
    const corner: number | undefined =
      u === 0 && v === 0
        ? ids[0]
        : u === 1
          ? ids[1]
          : v === 1
            ? ids[2]
            : undefined;
    const vertex: number = plan.nativeVertices + index;
    if (
      corner !== undefined &&
      point.some((one: number, axis: number): boolean  => one !== positions[vertex * 3 + axis])
    )
      throw new Error("Face source alias disagrees after native posing.");
    for (let axis: number = 0; axis < 3; axis++)
      output[vertex * 3 + axis] = point[axis];
  }
  return output;
}

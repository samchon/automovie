import type { IAutoMovieHumanFaceAttachmentPoint } from "../../structures/IAutoMovieHumanFaceAttachmentPoint";
import type { IAutoMovieHumanFaceBasisSurface } from "../../structures/IAutoMovieHumanFaceBasisSurface";
import type { IAutoMovieHumanFaceMaterialPatch } from "../../structures/IAutoMovieHumanFaceMaterialPatch";
import type { IHumanFaceSkinFrame } from "../skin/IHumanFaceSkinFrame";
import type { IHumanFaceSkinHost } from "../skin/IHumanFaceSkinHost";
import { createHumanFaceSkinHost } from "../skin/createHumanFaceSkinHost";
import type { IHumanFaceMaterialPatchGeometry } from "./structures/IHumanFaceMaterialPatchGeometry";

/**
 * Evaluate clipped material points through their actual current skin corners.
 * Native source generation and oriented host triangle identity are mandatory.
 * The same skin-frame owner supplies exact affine positions and its geometric
 * face-normal convention for an opposed or zero blend. Barycentric sum admission
 * is the existing three-addition rounding bound, not anatomical clearance.
 *
 * @evidence contracts/common.md#principled-implementation Same-generation oriented host triangles and complete barycentric stencils place each clipped material point on current source skin.
 * @evidence contracts/common.md#clear-and-simple-design The canonical skin host supplies affine positions and compatible normal convention while this helper owns patch incidence admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Named native endpoints must retain exact corner stencils; the eight-epsilon weight-sum bound is arithmetic admission rather than anatomical clearance.
 * @evidence contracts/common.md#meaningful-documentation The prose states metric source frame, current host identity, normals and barycentric rounding premise.
 * @evidence contracts/performance.md#efficient-algorithms Host construction and all patch points/incidence references are scanned; per-point frame evaluation reads actual triangle corners.
 * @evidence contracts/performance.md#reuse-equivalent-work One skin host serves all admitted material point queries and original patch indices are reused through an owned output copy.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned geometry owns arrays; host/admission temporaries expire without retaining source buffers or tasks.
 */
export function evaluateHumanFaceMaterialPatch(
  patch: IAutoMovieHumanFaceMaterialPatch,
  source: IAutoMovieHumanFaceBasisSurface,
  current: readonly number[],
): IHumanFaceMaterialPatchGeometry {
  if (
    patch.surface !== source.id ||
    patch.generation !== source.sourcePartition?.generation ||
    patch.qualification !== "authoredConvention" ||
    current.length !== source.positions.length ||
    current.some((value: number): boolean => !Number.isFinite(value)) ||
    patch.indices.length % 3 ||
    patch.points.length === 0 ||
    patch.indices.length === 0 ||
    patch.nativeVertices.length !== patch.points.length
  )
    throw new Error(
      "A material patch needs its complete current same-generation skin host.",
    );
  const resident: (point: number) => boolean = (point: number): boolean =>
    Number.isSafeInteger(point) && point >= 0 && point < patch.points.length;
  if (
    [
      ...patch.indices,
      ...patch.boundaries.flat(),
      ...patch.plica,
      patch.medialEndpoint,
      patch.upperEndpoint,
      patch.lowerEndpoint,
    ].some((point: number): boolean => !resident(point))
  )
    throw new Error(
      "Material patch incidence references a nonresident material point.",
    );
  const host: IHumanFaceSkinHost = createHumanFaceSkinHost(
      source.indices,
      current,
    ),
    positions: number[] = [],
    normals: number[] = [];
  for (let at: number = 0; at < patch.points.length; at++) {
    const point: IAutoMovieHumanFaceAttachmentPoint = patch.points[at],
      native: number | null = patch.nativeVertices[at];
    const sum: number = point.weights.reduce(
      (total: number, weight: number): number => total + weight,
      0,
    );
    if (
      !Number.isSafeInteger(point.triangle) ||
      point.triangle < 0 ||
      3 * point.triangle + 2 >= source.indices.length ||
      point.weights.length !== 3 ||
      [point.weights[0], point.weights[1], point.weights[2]].some(
        (weight: number): boolean =>
          !Number.isFinite(weight) || weight < 0 || weight > 1,
      ) ||
      Math.abs(sum - 1) > 8 * Number.EPSILON
    )
      throw new Error(
        "Material patch requires complete original-triangle barycentric support.",
      );
    if (native !== null) {
      const corner: number = source.indices
        .slice(3 * point.triangle, 3 * point.triangle + 3)
        .indexOf(native);
      if (
        !Number.isSafeInteger(native) ||
        native < 0 ||
        corner < 0 ||
        point.weights.some(
          (weight: number, at: number): boolean =>
            weight !== (at === corner ? 1 : 0),
        )
      )
        throw new Error(
          "Material patch native point identity differs from its complete original-corner stencil.",
        );
    }
    const frame: IHumanFaceSkinFrame = host.frame({
      triangle: point.triangle,
      weights: [point.weights[0], point.weights[1], point.weights[2]],
    });
    const length: number = Math.hypot(...frame.normal);
    if (
      !(length > 0) ||
      !Number.isFinite(length) ||
      [...frame.point, ...frame.normal].some(
        (value: number): boolean => !Number.isFinite(value),
      )
    )
      throw new Error(
        "Material patch has no finite compatible live host direction.",
      );
    positions.push(...frame.point);
    normals.push(...frame.normal);
  }
  return { positions, normals, indices: [...patch.indices] };
}

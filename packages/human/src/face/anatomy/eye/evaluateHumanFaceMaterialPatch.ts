import type { IAutoMovieHumanFaceBasisSurface } from "../../structures/IAutoMovieHumanFaceBasisSurface";
import type { IAutoMovieHumanFaceMaterialPatch } from "../../structures/IAutoMovieHumanFaceMaterialPatch";
import { createHumanFaceSkinHost } from "../skin/createHumanFaceSkinHost";
import type { IHumanFaceMaterialPatchGeometry } from "./structures/IHumanFaceMaterialPatchGeometry";

/**
 * Evaluate clipped material points through their actual current skin corners.
 * Native source generation and oriented host triangle identity are mandatory.
 * The same skin-frame owner supplies exact affine positions and its geometric
 * face-normal convention for an opposed or zero blend. Barycentric sum admission
 * is the existing three-addition rounding bound, not anatomical clearance.
 *
 * @evidence contracts/common.md#principled-implementation Ordered barycentric support evaluates the original live host triangle and its shared vertex normals.
 * @evidence contracts/common.md#clear-and-simple-design One evaluator carries current positions and directions for the registered patch.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Same-generation material identity replaces nearest-point fits or reference XYZ copies.
 * @evidence contracts/common.md#meaningful-documentation Explains host ownership, arithmetic domain and its geometric normal convention.
 * @evidence contracts/modeling.md#spatial-conventions Current head-frame metres and unit directions; weights remain dimensionless.
 * @evidence contracts/modeling.md#shared-boundaries Every cell, endpoint and boundary consumes the same evaluated material point table.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Evaluates existing source registration without defining a tissue part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The tissue consumer chooses emitted geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation The tissue consumer observes its final output.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Material interpolation supplies no clinical quantity.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits a mathematical material-point domain, not physiological values.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Consumes offline registration without personal sculpting.
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
    current.some((value) => !Number.isFinite(value)) ||
    patch.indices.length % 3 ||
    patch.points.length === 0 ||
    patch.indices.length === 0 ||
    patch.nativeVertices.length !== patch.points.length
  )
    throw new Error(
      "A material patch needs its complete current same-generation skin host.",
    );
  const resident = (point: number): boolean =>
    Number.isSafeInteger(point) && point >= 0 && point < patch.points.length;
  if (
    [
      ...patch.indices,
      ...patch.boundaries.flat(),
      ...patch.plica,
      patch.medialEndpoint,
      patch.upperEndpoint,
      patch.lowerEndpoint,
    ].some((point) => !resident(point))
  )
    throw new Error(
      "Material patch incidence references a nonresident material point.",
    );
  const host = createHumanFaceSkinHost(source.indices, current),
    positions: number[] = [],
    normals: number[] = [];
  for (let at = 0; at < patch.points.length; at++) {
    const point = patch.points[at],
      native = patch.nativeVertices[at];
    const sum = point.weights.reduce((total, weight) => total + weight, 0);
    if (
      !Number.isSafeInteger(point.triangle) ||
      point.triangle < 0 ||
      3 * point.triangle + 2 >= source.indices.length ||
      point.weights.length !== 3 ||
      point.weights.some(
        (weight) => !Number.isFinite(weight) || weight < 0 || weight > 1,
      ) ||
      Math.abs(sum - 1) > 8 * Number.EPSILON
    )
      throw new Error(
        "Material patch requires complete original-triangle barycentric support.",
      );
    if (native !== null) {
      const corner = source.indices
        .slice(3 * point.triangle, 3 * point.triangle + 3)
        .indexOf(native);
      if (
        !Number.isSafeInteger(native) ||
        native < 0 ||
        corner < 0 ||
        point.weights.some((weight, at) => weight !== (at === corner ? 1 : 0))
      )
        throw new Error(
          "Material patch native point identity differs from its complete original-corner stencil.",
        );
    }
    const frame = host.frame({
      triangle: point.triangle,
      weights: [point.weights[0], point.weights[1], point.weights[2]],
    });
    const length = Math.hypot(...frame.normal);
    if (
      !(length > 0) ||
      !Number.isFinite(length) ||
      [...frame.point, ...frame.normal].some((value) => !Number.isFinite(value))
    )
      throw new Error(
        "Material patch has no finite compatible live host direction.",
      );
    positions.push(...frame.point);
    normals.push(...frame.normal);
  }
  return { positions, normals, indices: [...patch.indices] };
}

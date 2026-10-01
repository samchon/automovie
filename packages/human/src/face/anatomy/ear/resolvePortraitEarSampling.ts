import { IPortraitEarShape } from "./IPortraitEarShape";
import { portraitEarSampling } from "./portraitEarSampling";

/**
 * Validate the pinna's anatomical dimensions and resolve independent sampling.
 * The returned sampling record is owned by the caller, including defaults.
 *
 * Bounds here only keep dimensions finite and positive: a living pinna range
 * is not encoded, so a positive but implausible scale is admitted.
 *
 * @evidence contracts/common.md#principled-implementation Admission is closed-form: every placement and scale must be finite, scales and projection strictly positive, embedding nonnegative, and the tessellation integers inside inclusive bounds, so a NaN, a fractional count or an adjacent out-of-range value refuses before geometry is built. The result is a copy, so the caller's shape and the shared default are never mutated. The bounds are tessellation budgets, not anatomical limits.
 * @evidence contracts/common.md#clear-and-simple-design One validator and one default owner (`portraitEarSampling`); this validator and the document resolver consume the same default instead of repeating it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is special-cased and nothing is patched around another module; the default is a named contract constant.
 * @evidence contracts/common.md#meaningful-documentation The comment states what is validated, that the sampling is independent of anatomy and that the caller owns the returned record.
 * @evidence contracts/modeling.md#spatial-conventions The function passes the placement and dimensions through in the head-frame millimetres and dimensionless scales that IPortraitEarShape defines and converts none of them; the sampling counts are dimensionless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part or group; it admits the numbers of the pinna builder.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface and meets no neighbouring part.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no displayed part; the pinna builder observes the assembled ear.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value; its bounds only keep dimensions finite and positive and the tessellation within a budget.
 */
export function resolvePortraitEarSampling(
  shape: IPortraitEarShape,
): NonNullable<IPortraitEarShape["sampling"]> {
  if (
    ![
      shape.centerY,
      shape.centerZ,
      shape.heightScale,
      shape.depthScale,
      shape.projection,
      shape.embedding,
    ].every(Number.isFinite) ||
    shape.heightScale <= 0 ||
    shape.depthScale <= 0 ||
    shape.projection <= 0 ||
    shape.embedding < 0
  )
    throw new Error(
      "Pinna dimensions need finite placement, positive scales/projection and nonnegative embedding.",
    );
  const sampling = shape.sampling ?? portraitEarSampling;
  if (
    ![sampling.columns, sampling.frontRows, sampling.backRows].every(
      Number.isInteger,
    ) ||
    sampling.columns < 8 ||
    sampling.columns > 512 ||
    sampling.frontRows < 2 ||
    sampling.frontRows > 256 ||
    sampling.backRows < 2 ||
    sampling.backRows > 256
  )
    throw new Error(
      "Pinna sampling needs 8..512 angular columns and 2..256 radial rows.",
    );
  return { ...sampling };
}

import { IPortraitEarShape } from "./IPortraitEarShape";
import { portraitEarSampling } from "./portraitEarSampling";

/**
 * Validate the pinna's anatomical dimensions and resolve independent sampling.
 * The returned sampling record is owned by the caller, including defaults.
 *
 * Bounds here only keep dimensions finite and positive: a living pinna range
 * is not encoded, so a positive but implausible scale is admitted.
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

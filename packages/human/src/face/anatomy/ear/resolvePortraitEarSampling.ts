import { IPortraitEarShape } from "./IPortraitEarShape";
import { portraitEarSampling } from "./portraitEarSampling";

/**
 * Validate the pinna's anatomical dimensions and resolve independent sampling.
 * The returned sampling record is owned by the caller, including defaults.
 *
 * Bounds here only keep dimensions finite and positive: a living pinna range
 * is not encoded, so a positive but implausible scale is admitted.
 *
 * @evidence contracts/common.md#principled-implementation Finite placement, positive source scales/projection, nonnegative embedding and bounded integral lattice counts admit the actual pinna construction inputs.
 * @evidence contracts/common.md#clear-and-simple-design Anatomical dimension admission precedes optional/default tessellation resolution and returns an owned three-count record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An implausible positive anatomical scale can still pass; unsupported sampling refuses instead of clipping or modifying a profile to fit geometry.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes owned sampling defaults from the absence of a living-pinna dimension range.
 * @evidence contracts/performance.md#efficient-algorithms Six dimension and three sampling scalar checks use constant work and one small result allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work Both direct pinna construction paths reuse the same admission/default owner and receive independent sampling copies.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned counts; the supplied shape/default record remains unchanged and no geometry/cache/handle is retained.
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
  const sampling: Readonly<{
    columns: number;
    frontRows: number;
    backRows: number;
  }> = shape.sampling ?? portraitEarSampling;
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

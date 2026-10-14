import { AutoMovieTextureBinding } from "@automovie/interface";

/**
 * Read the asset id from an admitted legacy string or structured texture binding. Sampling configuration belongs to the resolver and cache rather than this selector.
 *
 * @evidence contracts/common.md#principled-implementation The interface's string-versus-record representation supplies the exact asset text; callers must admit the binding shape and asset validity before resolution.
 * @evidence contracts/common.md#clear-and-simple-design A fixed representation selector is shared by cache priming and binding lookup, keeping asset identity separate from sampler equivalence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No texture fallback or normalization is invented and no malformed record is runtime-validated here.
 * @evidence contracts/common.md#meaningful-documentation Documents representation, returned asset identity and separate sampling/admission responsibility.
 * @evidence contracts/performance.md#efficient-algorithms One typeof branch/property read is fixed work without a scan or allocation strategy.
 * @evidence contracts/performance.md#reuse-equivalent-work Returns the existing text; cache/resolver owners decide equivalent decoding and sampler wrappers, not this selector.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows its binding and acquires or retains no decoded image, texture wrapper or task.
 */
export function textureBindingAsset(binding: AutoMovieTextureBinding): string {
  return typeof binding === "string" ? binding : binding.asset;
}

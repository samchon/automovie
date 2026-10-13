

/**
 * One external URI whose resident bytes the builder must bind before ingest.
 *
 * Data URIs are decoded in place and never listed; only a URI that names a sidecar file appears here.
 *
 * @evidence contracts/common.md#principled-implementation A resource is keyed by its exact declared URI and role, the two facts the builder needs to bind manifest-owned bytes, and a buffer keeps its glTF `byteLength` because the resolved bytes must match it.
 * @evidence contracts/common.md#clear-and-simple-design Buffers and images share one record discriminated by `kind`, since both resolve through the same `resolveResource` seam.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Data URIs are excluded rather than listed as resolvable, and an image carries `null` instead of an invented length.
 * @evidence contracts/common.md#meaningful-documentation The comments state that only sidecar URIs appear, that the URI is undecoded, which array declares each kind, and why an image has no length.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record is a three-field type with no runtime code.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This interface carries no work that two consumers could share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Three scalar fields per sidecar URI; the record never holds the resolved bytes.
 * @author Samchon
 */
export interface IAutoMovieExternalModelResource {
  /** URI exactly as the glTF declares it, unresolved and undecoded. */
  uri: string;

  /** Whether a `buffers` or an `images` entry declares the URI. */
  kind: "buffer" | "image";

  /** Declared `byteLength` of a buffer, which the resolved bytes must equal; `null` for an image, which glTF gives no length. */
  byteLength: number | null;
}

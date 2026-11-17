/**
 * One external URI whose resident bytes the builder must bind before ingest.
 *
 * Data URIs are decoded in place and never listed; only a URI that names a sidecar file appears here. The ingest inspector creates caller-owned rows and refuses conflicting roles or lengths for one URI. Its payload gate verifies exact positive buffer lengths and nonempty image bytes; it does not decode image media.
 *
 * @evidence contracts/development/design.md#principled-representation A resource is keyed by its exact declared URI and role, the two facts the builder needs to bind manifest-owned bytes, and a buffer keeps its glTF `byteLength` because the resolved bytes must match it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Buffers and images share one record discriminated by `kind`, since both resolve through the same `resolveResource` seam.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Data URIs are excluded rather than listed as resolvable, and an image carries `null` instead of an invented length.
 * @evidence contracts/development/common.md#meaningful-documentation The comments state that only sidecar URIs appear, that the URI is undecoded, which array declares each kind, and why an image has no length.
 */
export type IAutoMovieExternalModelResource = {
  /** URI exactly as the glTF declares it, unresolved and undecoded. */
  uri: string;

} & (
  | {
      /** A buffers entry declares this URI and its required extent. */
      kind: "buffer";

      /** Positive safe-integer glTF byteLength; resolved resident bytes must equal this count. */
      byteLength: number;
    }
  | {
      /** An images entry declares this URI without a byte-length field. */
      kind: "image";

      /** No length is declared for an image; the payload gate still requires nonempty resident bytes. */
      byteLength: null;
    }
);

/**
 * One external URI whose resident bytes the builder must bind before ingest.
 *
 * Data URIs are decoded in place and never listed; only a URI that names a
 * sidecar file appears here. The ingest inspector creates caller-owned rows and
 * refuses conflicting roles or lengths for one URI. Its payload gate verifies
 * exact positive buffer lengths and nonempty image bytes; it does not decode
 * image media.
 */
export type IAutoMovieExternalModelResource = {
  /** URI exactly as the glTF declares it, unresolved and undecoded. */
  uri: string;
} & (
  | {
      /** A buffers entry declares this URI and its required extent. */
      kind: "buffer";

      /**
       * Positive safe-integer glTF byteLength; resolved resident bytes must
       * equal this count.
       */
      byteLength: number;
    }
  | {
      /** An images entry declares this URI without a byte-length field. */
      kind: "image";

      /**
       * No length is declared for an image; the payload gate still requires
       * nonempty resident bytes.
       */
      byteLength: null;
    }
);

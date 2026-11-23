/**
 * Synchronous access to the resident bytes of an external glTF buffer or image.
 *
 * The host receives the exact declared URI without decoding or normalization
 * and returns borrowed bytes, or null when unavailable. Keep returned storage
 * stable until inspection returns or throws. The payload gate invokes this
 * capability once per external buffer or image declaration, including repeated
 * URIs; data URIs are decoded internally. Host effects and exceptions
 * propagate. Ingest performs no fetching or URI caching.
 *
 * @param uri Exact non-data URI from the inspected glTF declaration.
 * @returns Borrowed resident bytes or null; the payload gate checks exact
 *   declared buffer lengths and nonempty image data, without decoding image
 *   media.
 */
export type AutoMovieExternalModelResourceResolver = (
  uri: string,
) => Uint8Array | null;

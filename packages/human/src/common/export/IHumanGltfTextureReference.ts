import type { IAutoMovieTextureReference } from "@automovie/interface";

/**
 * One material texture binding normalized for the static glTF writer.
 *
 * `uri` is the resident data URI whose bytes become the glTF image, `mediaType`
 * the image type its prefix declares. `sampler` and `transform` are the
 * binding's own sampling intent, absent for a legacy string binding, which
 * keeps the writer's clamp-to-edge default and no UV transform.
 *
 *
 * @evidence contracts/common.md#principled-implementation Carries a resident PNG/JPEG URI and its declared media type with optional sampler/UV transform normalized by resolveHumanGltfTextureReference.
 * @evidence contracts/common.md#clear-and-simple-design Normalization data separates byte identity from per-slot sampling intent applied by the writer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Legacy strings preserve clamp-to-edge with no transform rather than inventing a structured sampler or external resource resolution.
 * @evidence contracts/common.md#meaningful-documentation Documents accepted data-URI prefixes and null sampling/transform meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This normalized binding shape chooses no decoding or sampling algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Binding fields carry intent; createGltfDocument separately keys image reuse by resident URI.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The binding record opens no image handle; the Document owner retains embedded image bytes.
 *
 *
 * @author Samchon
 */
export interface IHumanGltfTextureReference {
  /** Resident `data:image/png;base64,` or `data:image/jpeg;base64,` URI. */
  uri: string;

  /** Media type the URI prefix declares. */
  mediaType: "image/png" | "image/jpeg";

  /** Declared wrap and filter policy, or null for the writer's clamp default. */
  sampler: IAutoMovieTextureReference["sampler"] | null;

  /** Declared UV transform in texture turns, or null for none. */
  transform: IAutoMovieTextureReference["transform"] | null;
}

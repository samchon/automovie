import type { IAutoMovieTextureReference } from "@automovie/interface";

/**
 * One material texture binding normalized for the static glTF writer.
 *
 * `uri` is the resident data URI whose bytes become the glTF image, `mediaType`
 * the image type its prefix declares. `sampler` and `transform` are the
 * binding's own sampling intent, absent for a legacy string binding, which
 * keeps the writer's clamp-to-edge default and no UV transform.
 *
 * @evidence contracts/common.md#principled-implementation A structured binding keeps its declared sampler and UV transform through export instead of being refused or flattened to the legacy default.
 * @evidence contracts/common.md#clear-and-simple-design One named record carries exactly what the writer needs from either binding form.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record carries the binding's values unchanged; no sampling is invented for a legacy binding.
 * @evidence contracts/common.md#meaningful-documentation States each field, its source and the legacy default.
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

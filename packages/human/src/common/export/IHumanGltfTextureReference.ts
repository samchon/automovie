import type { IAutoMovieTextureReference } from "@automovie/interface";

/**
 * One material texture binding normalized for the static glTF writer.
 *
 * `uri` is the resident data URI whose bytes become the glTF image, `mediaType`
 * the image type its prefix declares. `sampler` and `transform` are the
 * binding's own sampling intent, absent for a legacy string binding, which
 * keeps the writer's clamp-to-edge default and no UV transform.
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

import {
  type IAutoMovieExternalModelInspection,
  inspectAutoMovieExternalModelBytes,
} from "@automovie/ingest";

import { resolveOnlyBuffer } from "./resolveOnlyBuffer";

/**
 * Exercise public static/humanoid inspection over resident JSON and an explicit resolver.
 */
export const inspect: (
  document: unknown,
  profile?: string,
  resolver?: (uri: string) => Uint8Array | null,
) => IAutoMovieExternalModelInspection = (
  document: unknown,
  profile: string = "gltf-static-v1",
  resolver: (uri: string) => Uint8Array | null = resolveOnlyBuffer,
): IAutoMovieExternalModelInspection =>
  inspectAutoMovieExternalModelBytes({
    path: "public/models/matrix.gltf",
    bytes: Buffer.from(JSON.stringify(document), "utf8"),
    profile,
    resolveResource: resolver,
  });

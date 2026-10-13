import { resolveOnlyBuffer } from "./resolveOnlyBuffer";
import { type IAutoMovieExternalModelInspection, inspectAutoMovieExternalModelBytes } from "@automovie/ingest";

/**
 * Exercise public static/humanoid inspection over resident JSON and an explicit resolver.
 *
 * Its owning matrix entry executes or asserts the resulting public inspector behavior without source-shape checks.
 * Constants and expected refusals follow glTF 2.0 storage/profile rules rather than sampling implementation output.
 * It preserves the original boundary case and neighboring valid controls through the matrix fact list.
 * This portable test support is called by test_ingest_external_model_validation_matrix, with resident bytes and no process, browser or GPU.
 */
export const inspect: (document: unknown, profile?: string, resolver?: (uri: string) => Uint8Array | null) => IAutoMovieExternalModelInspection = (
  document: unknown,
  profile: string = "gltf-static-v1",
  resolver: (uri: string) => Uint8Array | null = resolveOnlyBuffer,
) : IAutoMovieExternalModelInspection =>
  inspectAutoMovieExternalModelBytes({
    path: "public/models/matrix.gltf",
    bytes: Buffer.from(JSON.stringify(document), "utf8"),
    profile,
    resolveResource: resolver,
  });

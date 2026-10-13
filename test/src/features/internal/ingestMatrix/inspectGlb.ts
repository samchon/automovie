import { type IAutoMovieExternalModelInspection, inspectAutoMovieExternalModelBytes } from "@automovie/ingest";
import { glb } from "./glb";

/**
 * Exercise public inspection on a caller-encoded GLB container and explicit sidecar resolver.
 *
 * Its owning matrix entry executes or asserts the resulting public inspector behavior without source-shape checks.
 * Constants and expected refusals follow glTF 2.0 storage/profile rules rather than sampling implementation output.
 * It preserves the original boundary case and neighboring valid controls through the matrix fact list.
 * This portable test support is called by test_ingest_external_model_validation_matrix, with resident bytes and no process, browser or GPU.
 */
export const inspectGlb: (document: unknown, bin: Buffer | null, resolver?: (uri: string) => Uint8Array | null) => IAutoMovieExternalModelInspection = (
  document: unknown,
  bin: Buffer | null,
  resolver?: (uri: string) => Uint8Array | null,
) : IAutoMovieExternalModelInspection =>
  inspectAutoMovieExternalModelBytes({
    path: "public/models/matrix.glb",
    bytes: glb(document, bin),
    profile: "gltf-static-v1",
    resolveResource: resolver,
  });

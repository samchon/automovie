import {
  type IAutoMovieExternalModelInspection,
  inspectAutoMovieExternalModelBytes,
} from "@automovie/ingest";

import { glb } from "./glb";

/**
 * Exercise public inspection on a caller-encoded GLB container and explicit sidecar resolver.
 */
export const inspectGlb: (
  document: unknown,
  bin: Buffer | null,
  resolver?: (uri: string) => Uint8Array | null,
) => IAutoMovieExternalModelInspection = (
  document: unknown,
  bin: Buffer | null,
  resolver?: (uri: string) => Uint8Array | null,
): IAutoMovieExternalModelInspection =>
  inspectAutoMovieExternalModelBytes({
    path: "public/models/matrix.glb",
    bytes: glb(document, bin),
    profile: "gltf-static-v1",
    resolveResource: resolver,
  });

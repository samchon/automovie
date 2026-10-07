import zlib from "node:zlib";

import { readHumanSourceWorkBytes } from "./readHumanSourceWorkBytes.ts";
import type { IHumanSourceGenerationInput } from "./structures/IHumanSourceGenerationInput.ts";

/**
 * Read the pinned MPFB base mesh's faces (`mesh_metadata/
 * basemesh_face_to_vertex_table.json.gz`, CC0 data): each face as its vertex
 * loop. Subdivision keeps every base vertex at its own index as a source
 * sample, so these edges address the generation's skin directly.
 */
export function readHumanSourceBaseFaces(work: string, inputs: IHumanSourceGenerationInput[]): number[][] {
  return JSON.parse(
    zlib.gunzipSync(readHumanSourceWorkBytes(inputs, work, "upstream/mpfb2/src/mpfb/data/mesh_metadata/basemesh_face_to_vertex_table.json.gz", "native base polygon table")).toString("utf8"),
  );
}

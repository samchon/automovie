import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

/**
 * Read the pinned MPFB base mesh's faces (`mesh_metadata/
 * basemesh_face_to_vertex_table.json.gz`, CC0 data): each face as its vertex
 * loop. Subdivision keeps every base vertex at its own index as a source
 * sample, so these edges address the generation's skin directly.
 */
export function readHumanSourceBaseFaces(work: string): number[][] {
  return JSON.parse(
    zlib.gunzipSync(fs.readFileSync(path.join(work, "upstream/mpfb2/src/mpfb/data/mesh_metadata/basemesh_face_to_vertex_table.json.gz"))).toString("utf8"),
  );
}

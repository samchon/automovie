import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Read the acquired atlas's triangular OBJ without discarding source faces.
 *
 * Source vertex and normal ordinals must agree on every corner. Other OBJ
 * features refuse, so a quad, reordered corner normal or unsupported source
 * cannot be silently converted by this specific atlas compiler. One source
 * group and material label describe the whole surface; their actual labels
 * are retained by the compile receipt, rather than the diagnostic finish.
 * Multiple groups or material changes refuse instead of being flattened. Original
 * millimetres remain unchanged here; the registration stage owns conversion.
 */
export function readHumanBodyAtlasObj(text: string): IAutoMovieMesh {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const labels = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const fields = line.trim().split(/\s+/);
    const kind = fields.shift();
    if (kind === "" || kind === "#") continue;
    if (kind === "v" || kind === "vn") {
      const values = fields.map(Number);
      if (values.length !== 3 || !values.every(Number.isFinite))
        throw new Error("Atlas OBJ has invalid " + kind + " coordinates.");
      (kind === "v" ? positions : normals).push(...values);
    } else if (kind === "g" || kind === "usemtl") {
      if (labels.has(kind) || fields.length !== 1 || fields[0] === "")
        throw new Error(
          "Atlas OBJ requires one whole-surface " + kind + " label.",
        );
      labels.add(kind);
    } else if (kind === "f") {
      if (fields.length !== 3)
        throw new Error("Atlas OBJ requires source triangles.");
      for (const corner of fields) {
        const match = /^(\d+)\/\/(\d+)$/.exec(corner);
        if (match === null || match[1] !== match[2])
          throw new Error(
            "Atlas OBJ corner normal correspondence is unsupported: " + corner,
          );
        indices.push(Number(match[1]) - 1);
      }
    } else throw new Error("Atlas OBJ unsupported source record: " + kind);
  }
  if (
    positions.length === 0 ||
    normals.length !== positions.length ||
    indices.length === 0 ||
    indices.some(
      (at) => !Number.isSafeInteger(at) || at < 0 || at >= positions.length / 3,
    )
  )
    throw new Error("Atlas OBJ has empty or invalid indexed surface data.");
  return { positions, normals, indices, uvs: null, skin: null };
}

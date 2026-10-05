import type { IHumanSourceGeneration } from "./structures/IHumanSourceGeneration.ts";

/**
 * Read a skin point's row in the head frame: the barycentric blend of its
 * triangle's corner rows under one endpoint. Head-only rows are already
 * relative to the anchor carry; a cut vertex's absolute row is made relative
 * here, so every point reads in the same frame.
 */
export function createHumanSourceSkinPointRow(
  generation: IHumanSourceGeneration,
  anchorOf: (name: string) => number[],
): (name: string, triangle: number, weights: readonly number[]) => number[] {
  const skin = generation.skin;
  const n = skin.originalVertices;
  const cache = new Map<string, Map<number, number[]>>();
  const rowsOf = (name: string): Map<number, number[]> => {
    let map = cache.get(name);
    if (map === undefined) {
      map = new Map();
      const rows = generation.targets[name] ?? [];
      for (let i = 0; i < rows.length; i += 4) map.set(rows[i], rows.slice(i + 1, i + 4));
      cache.set(name, map);
    }
    return map;
  };
  return (name, triangle, weights) => {
    const map = rowsOf(name);
    const anchor = anchorOf(name);
    const out = [0, 0, 0];
    for (let k = 0; k < 3; k++) {
      const g = skin.triangles[3 * triangle + k];
      const value = map.get(g) ?? [0, 0, 0];
      for (let c = 0; c < 3; c++) out[c] += weights[k] * (value[c] - (g >= n ? anchor[c] : 0));
    }
    return out;
  };
}

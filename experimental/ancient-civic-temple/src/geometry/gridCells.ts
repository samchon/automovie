import { inside } from "./inside";
import type { PlanPoint } from "./PlanPoint";
import type { PlanRectangle } from "./PlanRectangle";
import { Tagged } from "./Tagged";

/** Grid cell union: takes the surface of the first tag covering the cell centre (core first). */

export const gridCells = (tags: readonly Tagged[], reject: (center: PlanPoint) => boolean) => {
  const xs = [...new Set(tags.flatMap((t) => [t.rect.west, t.rect.east]))].sort((a, b) => a - b);
  const zs = [...new Set(tags.flatMap((t) => [t.rect.north, t.rect.south]))].sort((a, b) => a - b);
  const cells: Array<{ rect: PlanRectangle; tag: Tagged; }> = [];
  for (let i = 0; i + 1 < xs.length; ++i) {
    for (let j = 0; j + 1 < zs.length; ++j) {
      const rect = { west: xs[i]!, east: xs[i + 1]!, north: zs[j]!, south: zs[j + 1]! };
      if (rect.east - rect.west < 1e-6 || rect.south - rect.north < 1e-6) continue;
      const center = { x: (rect.west + rect.east) / 2, z: (rect.north + rect.south) / 2 };
      const hits = tags.filter((t) => inside(t.rect, center));
      const tag = hits.find((t) => t.core) ?? hits[0];
      if (tag === undefined || (!tag.core && reject(center))) continue;
      cells.push({ rect, tag });
    }
  }
  return cells;
};

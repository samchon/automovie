import type { IHousePart } from "../types/IHousePart";
import { verifyRoofBoundaryPairs } from "./verifyRoofBoundaryPairs";
import { IRoofOverlapScan } from "./IRoofOverlapScan";
import { IRoofOverlap } from "./IRoofOverlap";
import { ISolid } from "./ISolid";
import { occupied } from "./occupied";
import { solid } from "./solid";

const overlapAt = (a: ISolid, b: ISolid, x: number, z: number): number => {
  const ay = occupied(a, x, z);
  if (ay === null) return 0;
  const by = occupied(b, x, z);
  return by === null
    ? 0
    : Math.max(0, Math.min(ay[1], by[1]) - Math.max(ay[0], by[0]));
};
/** Inspect each unordered pair on a cell-centred metric grid. */
export const scanRoofOverlaps = (
  parts: readonly Pick<IHousePart, "id" | "mesh">[],
  step = 0.01
): IRoofOverlapScan => {
  if (!(Number.isFinite(step) && step > 0)) throw new Error(
    "roof scan step must be positive and finite"
  );
  verifyRoofBoundaryPairs(parts);
  const shapes = parts.map((part) => solid(part.id, part.mesh));
  const overlaps: IRoofOverlap[] = [];
  let pairsChecked = 0;
  let samplesChecked = 0;
  for (let i = 0; i < shapes.length; i++) {
    const a = shapes[i]!;
    for (let j = i + 1; j < shapes.length; j++) {
      const b = shapes[j]!;
      const x0 = Math.max(a.x[0], b.x[0]);
      const x1 = Math.min(a.x[1], b.x[1]);
      const z0 = Math.max(a.z[0], b.z[0]);
      const z1 = Math.min(a.z[1], b.z[1]);
      if (x1 <= x0 || z1 <= z0 || Math.min(a.y[1], b.y[1]) <= Math.max(a.y[0], b.y[0])) continue;
      pairsChecked++;
      let sampledCells = 0;
      let maximumDepth = 0;
      let at = { x: 0, z: 0 };
      for (let x = x0 + step / 2; x < x1; x += step) {
        for (let z = z0 + step / 2; z < z1; z += step) {
          samplesChecked++;
          let depth = overlapAt(a, b, x, z);
          if (depth <= 1e-5) continue;
          // Two separate solids can share an entire vertical face along a
          // valley. A line through that face intersects both solids but has
          // zero-area contact. Require a positive neighbouring probe inside
          // the cell before calling it a volumetric overlap.
          const offset = step / 4;
          depth = Math.max(
            overlapAt(a, b, x - offset, z - offset),
            overlapAt(a, b, x - offset, z + offset),
            overlapAt(a, b, x + offset, z - offset),
            overlapAt(a, b, x + offset, z + offset)
          );
          if (depth <= 1e-5) continue;
          sampledCells++;
          if (depth > maximumDepth) {
            maximumDepth = depth;
            at = { x, z };
          }
        }
      }
      if (sampledCells > 0) overlaps.push({
        first: a.id,
        second: b.id,
        sampledCells,
        maximumDepth,
        at,
      });
    }
  }
  overlaps.sort((a, b) => b.maximumDepth - a.maximumDepth);
  return { step, pairsChecked, samplesChecked, overlaps };
};

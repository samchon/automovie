import { V3 } from "./V3.ts";
import { dist } from "./dist.ts";

/**
 * Connectivity-only spatial weld: coordinates remain unchanged and each vertex uses an earlier representative.
 *
 * @evidence contracts/common.md#principled-implementation A neighbour-cell search chooses an earlier representative within the declared connectivity tolerance without moving coordinates.
 * @evidence contracts/common.md#clear-and-simple-design The tolerance is an explicit length quantity; weld equivalence is not an anatomical fit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms Local grid lookup is near-linear on ordinary mesh density; dense coincident inputs have quadratic worst-case searches and O(n) stored representatives.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated work is reused only inside this operation where source identity is fixed; no cross-call or identity-dependent result cache exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The spatial grid is temporary; only canonical integer labels are returned.
 */
export function weld(vertices: V3[], tolerance: number = 1e-3): Int32Array {
  if (!(tolerance > 0))
    throw new Error(
      "Weld tolerance must be positive in the declared length units",
    );
  const cell: number = tolerance * 4;
  const grid: Map<string, number[]> = new Map();
  const canonical: Int32Array = new Int32Array(vertices.length);
  vertices.forEach((v: V3, i: number): void => {
    const c: number[] = v.map((x: number): number => Math.floor(x / cell));
    let found: number = -1;
    for (let x: number = -1; x <= 1 && found < 0; x++)
      for (let y: number = -1; y <= 1 && found < 0; y++)
        for (let z: number = -1; z <= 1 && found < 0; z++) {
          for (const j of grid.get(`${c[0] + x},${c[1] + y},${c[2] + z}`) ?? [])
            if (dist(vertices[j], v) < tolerance) {
              found = j;
              break;
            }
        }
    if (found >= 0) canonical[i] = found;
    else {
      canonical[i] = i;
      const key: string = c.join(",");
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key)!.push(i);
    }
  });
  return canonical;
}

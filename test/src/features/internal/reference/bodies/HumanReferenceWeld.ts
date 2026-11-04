
import type { HumanReference } from "./HumanReference";
import { HumanReferenceFiles } from "./HumanReferenceFiles";

/**
 * Each reference body's welded mesh, built by each call for
 * every comparison and observer that reads it.
 *
 * The source stores the head and the body as two parts whose shared neck seam
 * would otherwise read as an opening, so coincident vertices (equal to the
 * micrometre) are welded into one and triangles that collapse under the weld
 * are dropped. The mesh is built for each call and is read-only to its
 * consumers.
 */
export namespace HumanReferenceWeld {
  /**
   * Weld a reference body's parts into one mesh.
   *
   * @param id Reference alias.
   */
  export function get(id: string): HumanReference.IMesh {
    const model: HumanReferenceFiles.IModel = HumanReferenceFiles.model(id);
    const positions: number[] = [];
    const indices: number[] = [];
    const parts: number[] = [];
    const weld: Map<string, number> = new Map();

    model.parts.forEach((part: HumanReferenceFiles.IPart, k: number): void => {
      const local: number[] = [];
      const P: number[] = part.geometry.mesh.positions;

      // Key each vertex by its position to the micrometre, in millimetres.
      for (let v: number = 0; v < P.length; v += 3) {
        const x: number = P[v]! * 1000;
        const y: number = P[v + 1]! * 1000;
        const z: number = P[v + 2]! * 1000;
        const key: string = `${Math.round(x * 1e3)},${Math.round(y * 1e3)},${Math.round(z * 1e3)}`;
        let at: number | undefined = weld.get(key);

        if (at === undefined) {
          at = positions.length / 3;
          weld.set(key, at);
          positions.push(x, y, z);
        }
        local.push(at);
      }

      const I: number[] = part.geometry.mesh.indices;

      for (let t: number = 0; t < I.length; t += 3) {
        const a: number = local[I[t]!]!;
        const b: number = local[I[t + 1]!]!;
        const c: number = local[I[t + 2]!]!;

        if (a === b || b === c || c === a) continue;
        indices.push(a, b, c);
        parts.push(k);
      }
    });

    return {
      id,
      P: Float64Array.from(positions),
      I: Uint32Array.from(indices),
      part: Uint8Array.from(parts),
    };
  }
}

import { Singleton } from "tstl";

import type { HumanReference } from "./HumanReference";
import { HumanReferenceFiles } from "./HumanReferenceFiles";
import { HumanReferenceMeshSingleton } from "./HumanReferenceMeshSingleton";

/**
 * For each reference body, the raw vertex behind every welded vertex, found
 * once per process and shared by the surface and the layer comparisons.
 *
 * The population bodies are not welded, so a welded vertex of a reference
 * finds its row in them through this map. It repeats the weld
 * `HumanReferenceMeshSingleton` applies, keeping each position's first raw
 * vertex, and is checked against the welded mesh vertex by vertex, so a weld
 * that drifts from the mesh's throws instead of reading another point of
 * anatomy.
 */
export namespace HumanReferenceRawOrderSingleton {
  /**
   * The raw vertex index of every welded vertex of a reference, found on
   * first use.
   *
   * @param id Reference alias.
   * @throws Error when the weld disagrees with the welded mesh.
   */
  export function get(id: string): Int32Array {
    let found: Singleton<Int32Array> | undefined = cache.get(id);

    if (found === undefined) {
      found = new Singleton((): Int32Array => build(id));
      cache.set(id, found);
    }
    return found.get();
  }

  /** One singleton per reference alias. */
  const cache: Map<string, Singleton<Int32Array>> = new Map();

  /**
   * Repeat the weld and check it against the welded mesh.
   *
   * @param id Reference alias.
   */
  function build(id: string): Int32Array {
    const mesh: HumanReference.IMesh = HumanReferenceMeshSingleton.get(id);
    const P: Float64Array = HumanReferenceFiles.positions(id);
    const out: Int32Array = new Int32Array(mesh.P.length / 3).fill(-1);
    const weld: Map<string, number> = new Map();
    let next: number = 0;

    for (let v: number = 0; v < P.length / 3; v++) {
      const key: string = `${Math.round(P[3 * v]! * 1e3)},${Math.round(P[3 * v + 1]! * 1e3)},${Math.round(P[3 * v + 2]! * 1e3)}`;

      if (weld.has(key)) continue;
      weld.set(key, next);
      out[next++] = v;
    }

    if (next !== out.length) throw new Error(`${id}: the weld gave ${next} vertices, the reference ${out.length}`);

    // The order must agree with the mesh's own weld, vertex by vertex.
    for (let w: number = 0; w < out.length; w++)
      for (let a: number = 0; a < 3; a++)
        if (Math.abs(P[3 * out[w]! + a]! - mesh.P[3 * w + a]!) > 1e-9)
          throw new Error(`${id}: welded vertex ${w} does not match its raw vertex`);
    return out;
  }
}

import type { IHumanSourceCompactedTopology } from "./structures/IHumanSourceCompactedTopology.ts";
import type { IHumanSourceTopology } from "./structures/IHumanSourceTopology.ts";

/**
 * Remove retired authoring points from the emitted canonical triangle tree.
 * Retained native ordinals are visited in ascending order, so compaction never
 * depends on polygon visitation or runtime locations. Oriented parent order,
 * corner UVs and frame remain unchanged; the two explicit maps distinguish
 * source authoring IDs from dense canonical IDs. This does not judge biological
 * fit, closure, embedding or appearance of the provider's actual geometry.
 * The authored-topology builder consumes this result before the publisher
 * rebuilds its cut samples and both P1 views from the compacted tree.
 */
export function compactHumanSourceTopology(input: IHumanSourceTopology): IHumanSourceCompactedTopology {
  if (!Number.isSafeInteger(input.vertexCount) || input.vertexCount < 1 ||
      input.positions.length !== 3 * input.vertexCount ||
      input.triangles.length === 0 || input.triangles.length % 3 !== 0 ||
      input.cornerUv.length !== 2 * input.triangles.length)
    throw new Error("Authored source compaction needs complete positions, triples and corner UVs.");
  const active = new Uint8Array(input.vertexCount);
  for (const vertex of input.triangles) {
    if (!Number.isSafeInteger(vertex) || vertex < 0 || vertex >= input.vertexCount)
      throw new Error(`Authored source triangle references absent native vertex ${vertex}.`);
    active[vertex] = 1;
  }
  const nativeToSource = new Int32Array(input.vertexCount).fill(-1);
  const retained: number[] = [];
  for (let native = 0; native < input.vertexCount; native++) {
    if (active[native] === 0) continue;
    nativeToSource[native] = retained.length;
    retained.push(native);
  }
  const positions = new Float64Array(3 * retained.length);
  retained.forEach((native, canonical) => {
    for (let axis = 0; axis < 3; axis++) {
      const value = input.positions[3 * native + axis];
      if (!Number.isFinite(value)) throw new Error(`Authored source vertex ${native} has nonfinite geometry.`);
      positions[3 * canonical + axis] = value;
    }
  });
  if (input.cornerUv.some((value) => !Number.isFinite(value)))
    throw new Error("Authored source compaction needs finite corner UVs.");
  return {
    topology: {
      offset: input.offset,
      vertexCount: retained.length,
      positions,
      triangles: Int32Array.from(input.triangles, (native) => nativeToSource[native]),
      cornerUv: input.cornerUv.slice(),
    },
    nativeToSource,
    sourceToNative: Int32Array.from(retained),
  };
}

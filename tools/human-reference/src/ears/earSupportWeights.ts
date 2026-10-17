import type { Bone } from "../geometry/Bone.ts";
import type { V3 } from "../geometry/V3.ts";
import type { HeadContext } from "../headneck/HeadContext.ts";

/**
 * Maps explicitly declared source-rig support groups onto combined skin
 * positions. The declaration supplies private bone names; this implementation
 * contains no rig vocabulary or anatomical attachment assumption.
 *
 * Coincident source vertices use the maximum summed influence, preserving the
 * union of their diagnostic supports. The result identifies an observation
 * scope including nearby scalp; it does not measure an auricular insertion.
 *
 * @evidence contracts/common.md#principled-implementation Exact coordinate identity maps unchanged head vertices into the combined skin, and a maximum over coincident influences conservatively preserves the declared diagnostic support.
 * @evidence contracts/common.md#clear-and-simple-design The function owns only rig-support translation; anatomical naming, plane families and reconstruction belong to its caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every support name comes from private admitted input rather than a maintained source-specific bone table or index.
 * @evidence contracts/common.md#meaningful-documentation The contract explains coordinate matching, coincident influences, private support ownership and the distinction from anatomical insertion.
 * @evidence contracts/performance.md#efficient-algorithms Bone-name lookup takes O(B), source influence traversal O(W), and combined vertex mapping O(V), retaining one source-position map and one V-length scalar array.
 * @evidence contracts/performance.md#reuse-equivalent-work The admitted source context and weights are reused; no cross-context cache retains stale geometry or support declarations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The coordinate map is invocation-local; the returned scalar array is caller-owned and bounded by the combined skin vertex count.
 */
export function earSupportWeights(
  context: HeadContext,
  declaredBoneNames: readonly string[],
): Float64Array {
  const sourceWeights: [number, number][][] | undefined =
    context.g.head.weights;
  if (
    !sourceWeights ||
    sourceWeights.length !== context.g.head.vertices.length ||
    !declaredBoneNames.length
  )
    throw new Error(
      "Ear observations require declared source support names and complete head weights",
    );
  const names: Set<string> = new Set(declaredBoneNames);
  const bones: Bone[] = context.g.head.bones.filter((bone: Bone): boolean =>
    names.has(bone.name),
  );
  if (bones.length !== names.size)
    throw new Error(
      "A declared ear support group is absent from the admitted source rig",
    );
  const indices: Set<number> = new Set(
    bones.map((bone: Bone): number => bone.index),
  );
  const byPosition: Map<string, number> = new Map();
  context.g.head.vertices.forEach((point: V3, i: number): void => {
    const influence: number = sourceWeights[i].reduce(
      (sum: number, pair: [number, number]): number =>
        sum + (indices.has(pair[0]) ? pair[1] : 0),
      0,
    );
    const key: string = point.join(",");
    byPosition.set(key, Math.max(influence, byPosition.get(key) ?? 0));
  });
  return Float64Array.from(
    context.s.vertices,
    (point: V3): number => byPosition.get(point.join(",")) ?? 0,
  );
}

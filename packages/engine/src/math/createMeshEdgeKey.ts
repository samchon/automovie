/**
 * Choose an exact key for pairs of welded vertex identities.
 *
 * A mesh consumer supplies the welded population once, then calls this key
 * function with integer endpoints in [0, vertexCount), retaining their order.
 * When vertexCount squared is a safe integer, from * vertexCount + to is an
 * injective base-vertexCount encoding and every intermediate is exact. Larger
 * populations retain a delimited integer pair instead of losing low bits or
 * introducing a mesh-size refusal. The representation stays fixed throughout
 * one traversal, so numeric and string identities cannot mix for one edge.
 * Directed consumers pass from/to unchanged; undirected consumers order the
 * pair before calling, since endpoint order is part of this key's identity.
 *
 * This helper owns pair encoding only. Position quantization, endpoint ordering
 * and incidence counts stay with the welding and consuming owners. No geometry
 * or caller state is mutated, and a malformed population refuses before a key
 * function exists. Endpoint admission is the consuming caller's precondition.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation Keeps distinct welded edges distinct throughout topology admission, including populations beyond exact numeric pair encoding.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure Supplies an exact pair identity to the shared topology validator without changing its coordinate labels or violation order.
 */
export function createMeshEdgeKey(
  vertexCount: number,
): (from: number, to: number) => number | string {
  if (!Number.isSafeInteger(vertexCount) || vertexCount < 0)
    throw new Error("A mesh edge key needs a nonnegative safe vertex count.");
  return Number.isSafeInteger(vertexCount * vertexCount)
    ? (from, to) => from * vertexCount + to
    : (from, to) => `${from}/${to}`;
}

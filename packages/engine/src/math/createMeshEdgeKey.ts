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
 * @evidence contracts/common.md#principled-implementation Admitted integer pairs have injective base-population encoding while the squared population is safe; larger populations use delimited integers without losing endpoint bits.
 * @evidence contracts/common.md#clear-and-simple-design The factory owns pair encoding while consumers own directed ordering, welding and edge incidence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The binary64 safe-integer boundary alone selects representation; large meshes are not refused to preserve numeric keys.
 * @evidence contracts/common.md#meaningful-documentation States endpoint admission, ordered identity, safe numeric bound, string fallback and undirected ordering responsibility.
 * @evidence contracts/performance.md#efficient-algorithms Admission and each key use constant scalar work; the closure avoids checking population safety for every edge.
 * @evidence contracts/performance.md#reuse-equivalent-work One closure fixes representation throughout the traversal, preventing equivalent edges from mixing numeric and string keys.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains only vertexCount; numeric keys allocate no object and string keys belong to consuming incidence maps.
 */
export function createMeshEdgeKey(
  vertexCount: number,
): (from: number, to: number) => number | string {
  if (!Number.isSafeInteger(vertexCount) || vertexCount < 0)
    throw new Error("A mesh edge key needs a nonnegative safe vertex count.");
  return Number.isSafeInteger(vertexCount * vertexCount)
    ? (from: number, to: number): number => from * vertexCount + to
    : (from: number, to: number): string => `${from}/${to}`;
}

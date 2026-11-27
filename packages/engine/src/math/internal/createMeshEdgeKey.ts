/*
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
 */
export function createMeshEdgeKey(
  vertexCount: number,
): (from: number, to: number) => number | string {
  if (vertexCount < 0 || vertexCount > Number.MAX_SAFE_INTEGER)
    throw new Error("A mesh edge key needs a nonnegative safe vertex count.");
  return vertexCount * vertexCount <= Number.MAX_SAFE_INTEGER
    ? (from: number, to: number): number => from * vertexCount + to
    : (from: number, to: number): string => `${from}/${to}`;
}

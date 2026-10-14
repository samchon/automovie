import { IAutoMovieNode, IAutoMovieTransform } from "@automovie/interface";

import { Matrix4 } from "../math/Matrix4";

const indexNodes: (
  nodes: readonly IAutoMovieNode[],
) => Map<string, { node: IAutoMovieNode; index: number }> = (
  nodes: readonly IAutoMovieNode[],
): Map<string, { node: IAutoMovieNode; index: number }> => {
  const byId: Map<string, { node: IAutoMovieNode; index: number }> = new Map<
    string,
    { node: IAutoMovieNode; index: number }
  >();
  nodes.forEach((node: IAutoMovieNode, index: number): void => {
    const existing: { node: IAutoMovieNode; index: number } | undefined =
      byId.get(node.id);
    if (existing !== undefined)
      throw new Error(
        `node id "${node.id}" is duplicated at nodes[${index}].id; first declared at nodes[${existing.index}].id`,
      );
    byId.set(node.id, { node, index });
  });
  nodes.forEach((node: IAutoMovieNode, index: number): void => {
    if (node.parent !== null && !byId.has(node.parent))
      throw new Error(
        `node "${node.id}" references missing parent "${node.parent}" at nodes[${index}].parent`,
      );
  });
  return byId;
};

/**
 * The COMPOSE pass: turn a flat list of nodes (each with a parent-local TRS)
 * into a world matrix per node, walking parent-before-child.
 *
 * `localOverrides` carries the transforms the sample/constrain passes produced
 * for animated nodes; a node absent from the map keeps its rest-pose
 * {@link IAutoMovieNode} transform. Resolution is memoized and parent-driven, so
 * the input list may be in any order. A child seen before its parent pulls the
 * parent in on demand.
 *
 * Composition is a real matrix product (via {@link Matrix4}) rather than TRS
 * concatenation, so a non-uniformly scaled parent rotating a child shears
 * correctly instead of approximately.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Admit unique ids and existing parents, recursively resolve parent-first matrices with cycle detection and memoization, and multiply full matrices so nonuniform-scale shear survives composition.
 * @evidence contracts/common.md#clear-and-simple-design An id index owns graph admission and one resolver closure owns rest/override local composition independent of input ordering.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing parents, duplicate ids and cycles throw; arbitrary deep acyclic graphs can still exceed recursion depth, and numerical transform validity remains caller admission.
 * @evidence contracts/common.md#meaningful-documentation Docs state parent-local transforms, override absence retaining rest pose, arbitrary node order and column-major full-matrix output.
 * @evidence contracts/performance.md#efficient-algorithms N nodes require O(N) fixed-size matrix work and O(N) maps/results, with recursion stack O(H) for hierarchy depth H.
 * @evidence contracts/performance.md#reuse-equivalent-work Each node's completed world matrix is reused for all children within this call; changed graph/local overrides require a fresh composition.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns returned matrices/map; admission indices and active-path set are released on return/failure, with no native scene graph or task retained.
 */
export const composeScene: (
  nodes: IAutoMovieNode[],
  localOverrides?: Map<string, IAutoMovieTransform>,
) => Map<string, number[]> = (
  nodes: IAutoMovieNode[],
  localOverrides?: Map<string, IAutoMovieTransform>,
): Map<string, number[]> => {
  const byId: Map<string, { node: IAutoMovieNode; index: number }> =
    indexNodes(nodes);
  const world: Map<string, number[]> = new Map<string, number[]>();
  const resolving: Set<string> = new Set<string>();

  const resolve: (id: string) => number[] = (id: string): number[] => {
    const cached: number[] | undefined = world.get(id);
    if (cached !== undefined) return cached;
    if (resolving.has(id))
      throw new Error(`node parent cycle includes "${id}"`);
    resolving.add(id);
    const node: IAutoMovieNode = byId.get(id)!.node;
    const t: IAutoMovieTransform = localOverrides?.get(id) ?? node.transform;
    const local: number[] = Matrix4.compose(t.translation, t.rotation, t.scale);
    const m: number[] =
      node.parent === null
        ? local
        : Matrix4.multiply(resolve(node.parent), local);
    world.set(id, m);
    resolving.delete(id);
    return m;
  };

  for (const node of nodes) resolve(node.id);
  return world;
};

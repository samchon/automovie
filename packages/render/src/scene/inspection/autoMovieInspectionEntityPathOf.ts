import type * as THREE from "three";

/**
 * The unique inspection identity of a displayed node beneath `root`.
 *
 * Named nodes form a `/`-joined name path, as `autoMovieInspectionPathOf`
 * reads it, so unnamed wrapper groups add no segment. Among the named nodes
 * that share the same nearest named ancestor (or the root), a name held by
 * more than one becomes `name#k`, with `k` the node's 0-based order among them
 * in depth-first child order. Unnamed nodes below the nearest named ancestor
 * append `.children[i]`, their index in the parent, and a node with no named
 * ancestor starts from `scene`. With unique names and named nodes the result
 * equals `autoMovieInspectionPathOf`.
 *
 * A caller naming many nodes of one unchanged graph passes one `frontiers`
 * map to all calls, so each ancestor's frontier is scanned once; a graph that
 * changes between calls needs a fresh map.
 *
 * @param root The inspected root, which adds no segment.
 * @param object The node to identify, the root or beneath it.
 * @param frontiers Optional memo of each ancestor's named frontier, valid while the graph is unchanged.
 * @returns The node's identity, unique among the nodes beneath `root`.
 * @throws {Error} When `object` is not `root` or beneath it.
 * @evidence contracts/development/common.md#meaningful-documentation States the segment, disambiguator, unnamed-node and root rules, and when the result matches the shared name path.
 * @evidence contracts/development/implementation.md#principled-implementation A segment is unique among the named nodes under the same nearest named ancestor, and unnamed indices are unique in their parent, so by induction from the root the joined path is unique.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One walk to the root collects named segments and unnamed indices, then one join.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No uuid, visit order or film time enters, so the identity is stable across samples and hosts.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each named segment needs its ancestor's frontier of named nodes through unnamed wrappers. Without a memo a path costs the sum of those frontiers along its depth; with one shared memo, naming every node of a graph scans each frontier once, linear in the graph.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Keeps the shared name path for unique names, so existing selections and labels still match, and lets callers share frontier scans across one sample.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a string. Only the caller's optional memo retains nodes, for as long as the caller keeps it.
 */
export function autoMovieInspectionEntityPathOf(
  root: THREE.Object3D,
  object: THREE.Object3D,
  frontiers?: Map<
    THREE.Object3D,
    ReadonlyMap<string, readonly THREE.Object3D[]>
  >,
): string {
  const chain: THREE.Object3D[] = [];
  let current: THREE.Object3D | null = object;
  while (current !== null && current !== root) {
    chain.push(current);
    current = current.parent;
  }
  if (current === null)
    throw new Error(
      `Object "${object.name}" is not beneath the inspected root "${root.name}"`,
    );
  chain.reverse();
  const names: string[] = [];
  const indices: string[] = [];
  let anchor: THREE.Object3D = root;
  for (const node of chain) {
    if (node.name !== "") {
      names.push(segmentOf(anchor, node, frontiers));
      anchor = node;
      indices.length = 0;
    } else indices.push(`children[${node.parent!.children.indexOf(node)}]`);
  }
  return [names.length === 0 ? "scene" : names.join("/"), ...indices].join(".");
}

/**
 * A named node's segment under its nearest named ancestor: its name, with `#k`
 * when another named node of that ancestor's frontier shares the name.
 */
function segmentOf(
  anchor: THREE.Object3D,
  node: THREE.Object3D,
  frontiers:
    | Map<THREE.Object3D, ReadonlyMap<string, readonly THREE.Object3D[]>>
    | undefined,
): string {
  let frontier: ReadonlyMap<string, readonly THREE.Object3D[]> | undefined =
    frontiers?.get(anchor);
  if (frontier === undefined) {
    frontier = frontierOf(anchor);
    frontiers?.set(anchor, frontier);
  }
  const same: readonly THREE.Object3D[] = frontier.get(node.name) ?? [node];
  return same.length <= 1 ? node.name : `${node.name}#${same.indexOf(node)}`;
}

/**
 * The named nodes whose nearest named ancestor is `anchor`, grouped by name in
 * depth-first child order.
 */
function frontierOf(
  anchor: THREE.Object3D,
): ReadonlyMap<string, readonly THREE.Object3D[]> {
  const groups: Map<string, THREE.Object3D[]> = new Map();
  const visit = (parent: THREE.Object3D): void => {
    for (const child of parent.children)
      if (child.name === "") visit(child);
      else {
        const group: THREE.Object3D[] | undefined = groups.get(child.name);
        if (group === undefined) groups.set(child.name, [child]);
        else group.push(child);
      }
  };
  visit(anchor);
  return groups;
}

import type * as THREE from "three";

/*
 * The unique inspection identity of a displayed node beneath `root`.
 *
 * Named nodes form a `/`-joined name path, as `AutoMovieRenderInspectionPath.pathOf` reads
 * it, so unnamed wrapper groups add no segment. Among the named nodes that
 * share the same nearest named ancestor (or the root), a name held by more than
 * one becomes `name#k`, with `k` the node's 0-based order among them in
 * depth-first child order. Unnamed nodes below the nearest named ancestor
 * append `.children[i]`, their index in the parent, and a node with no named
 * ancestor starts from `scene`. With unique names and named nodes the result
 * equals `AutoMovieRenderInspectionPath.pathOf`.
 *
 * A caller naming many nodes of one unchanged graph passes one `frontiers` map
 * to all calls, so each ancestor's frontier is scanned once; a graph that
 * changes between calls needs a fresh map.
 * Parameter root: The inspected root, which adds no segment.
 * Parameter object: The node to identify, the root or beneath it.
 * Parameter frontiers: Optional memo of each ancestor's named frontier, valid while
 * the graph is unchanged.
 * Returns: The node's identity, unique among the nodes beneath `root`.
 * When `object` is not `root` or beneath it.
 */
export function autoMovieInspectionEntityPathOfImplementation(
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

/*
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

/*
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

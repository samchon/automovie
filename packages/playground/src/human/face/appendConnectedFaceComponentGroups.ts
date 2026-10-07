import type { IAutoMovieHumanFaceComponentTree } from "@automovie/human";

/**
 * Append one collapsible group per component-tree node, each holding its own
 * channels (through `appendChannel`) and its child groups, and drop a group
 * that ends up with no visible row (every control filtered out by search).
 * The tree only groups controls for navigation; it changes neither channel
 * IDs nor evaluation order.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Groups fine controls by facial component for navigation.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Groups channels by component-tree node and drops groups the search leaves empty.
 */
export function appendConnectedFaceComponentGroups(
  node: IAutoMovieHumanFaceComponentTree.Node,
  parent: HTMLElement,
  appendChannel: (id: string, group: HTMLElement) => void,
): void {
  const dom = parent.ownerDocument;
  const group = dom.createElement("details");
  group.dataset.component = node.id;
  group.open = true;
  const summary = dom.createElement("summary");
  summary.textContent = node.label;
  group.append(summary);
  parent.append(group);
  for (const id of node.channels) appendChannel(id, group);
  for (const child of node.children)
    appendConnectedFaceComponentGroups(child, group, appendChannel);
  if (group.querySelector(".row") === null) group.remove();
}

import type { IAutoMovieHumanFaceComponentTree } from "@automovie/human";

/**
 * Append one collapsible group per component-tree node, each holding its own channels (through `appendChannel`) and its child groups, and drop a group that ends up with no visible row (every control filtered out by search). The tree only groups controls for navigation; it changes neither channel IDs nor evaluation order.
 *
 * @evidence contracts/common.md#principled-implementation Recursive tree traversal preserves source component hierarchy and channel identity, while groups without any filtered row are removed after their children have rendered.
 * @evidence contracts/common.md#clear-and-simple-design The helper owns navigation group DOM and delegates channel row creation through the supplied callback without duplicating control or document semantics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Navigation hierarchy does not reorder numerical evaluation or rename saved channels, and empty groups receive no fabricated rows.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies recursive channel/child groups, search-dependent pruning and preservation of canonical channel identity and evaluation order.
 * @evidence contracts/performance.md#efficient-algorithms Traversal visits n nodes and c channel references once; postorder descendant-row selectors can scan O(nr) DOM in the worst case for r rendered rows, while recursion retains O(h) stack frames at tree height h and output DOM is O(n+r).
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Navigation redraw creates container-specific DOM and shares no numerical build or projection result across requests.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Empty groups detach immediately and surviving group DOM transfers to the parent until redraw or close; this helper acquires no listener, timer or external resource.
 */
export function appendConnectedFaceComponentGroups(
  node: IAutoMovieHumanFaceComponentTree.Node,
  parent: HTMLElement,
  appendChannel: (id: string, group: HTMLElement) => void,
): void {
  const dom: Document = parent.ownerDocument;
  const group: HTMLDetailsElement = dom.createElement("details");
  group.dataset.component = node.id;
  group.open = true;
  const summary: HTMLElement = dom.createElement("summary");
  summary.textContent = node.label;
  group.append(summary);
  parent.append(group);
  for (const id of node.channels) appendChannel(id, group);
  for (const child of node.children)
    appendConnectedFaceComponentGroups(child, group, appendChannel);
  if (group.querySelector(".row") === null) group.remove();
}

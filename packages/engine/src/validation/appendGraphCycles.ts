import { ViolationCollector } from "./ViolationCollector";

/**
 * Report every link that closes a cycle in a graph of declared ids.
 *
 * Nodes are visited depth first in declaration order, following each node's
 * `links` in order. A link to a node still on the current path closes a cycle
 * and pushes one `type` violation with `message` at that target node's `path`,
 * carrying its `value`. A link naming no node is skipped, because the dangling
 * reference is reported on its own path, and a node already finished is not
 * walked again. Ids are matched by string equality; when two nodes share an
 * id, the later one stands for it.
 *
 * The walk keeps its own stack instead of recursing, so a chain as long as the
 * whole graph, such as a revision history thousands deep, cannot overflow the
 * call stack.
 *
 * @param nodes Graph nodes with their outgoing links, the violation path to
 *   report a cycle on, and the value to report there.
 * @param message Violation message, such as `design revision graph must be
 *   acyclic`.
 * @param collector Sink that receives the violations.
 *
 * @evidence contracts/common.md#principled-implementation Three-color depth-first search, where a back edge to a node still on the path is exactly the witness of a directed cycle; the explicit stack reproduces the recursive visiting order, so the same back edges are reported in the same order, without the recursion depth limit.
 * @evidence contracts/common.md#clear-and-simple-design One cycle walk shared by the lineage graphs and the building's element and space hierarchies, which previously kept a recursive `appendCycles` and a recursive `appendHierarchyCycles`; callers supply the path, value and message their record owns.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No graph or id is special-cased; dangling links are skipped by the stated rule because another check owns them, not to hide a cycle.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the visiting order, where and with what a cycle is reported, how dangling links and duplicate ids are treated, and why the walk is iterative.
 * @evidence contracts/performance.md#efficient-algorithms O(V + E) time for V nodes and E links, each node entered once and each link followed once, with O(V) space for the id index, the color map and the stack.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One walk over one graph per call; each validator calls it once per graph it owns.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The id index, color map and stack are local and released on return, each bounded by the node count; one violation per back edge is appended to the caller's collector.
 */
export const appendGraphCycles = (
  nodes: readonly {
    id: string;
    links: readonly string[];
    path: string;
    value: unknown;
  }[],
  message: string,
  collector: ViolationCollector,
): void => {
  type Node = (typeof nodes)[number];
  const byId: Map<string, Node> = new Map(
    nodes.map((node: Node): [string, Node] => [node.id, node]),
  );
  const states: Map<string, "visiting" | "visited"> = new Map();
  for (const start of nodes) {
    if (states.has(start.id)) continue;
    states.set(start.id, "visiting");
    const stack: { node: Node; link: number }[] = [{ node: start, link: 0 }];
    while (stack.length !== 0) {
      const frame: { node: Node; link: number } = stack[stack.length - 1]!;
      if (frame.link === frame.node.links.length) {
        states.set(frame.node.id, "visited");
        stack.pop();
        continue;
      }
      const next: Node | undefined = byId.get(frame.node.links[frame.link]!);
      frame.link += 1;
      if (next === undefined) continue;
      const state: "visiting" | "visited" | undefined = states.get(next.id);
      if (state === "visiting")
        collector.push("type", next.path, message, next.value);
      else if (state === undefined) {
        states.set(next.id, "visiting");
        stack.push({ node: next, link: 0 });
      }
    }
  }
};

import type {
  IAutoMovieAppendGraphCycles,
  IAutoMovieViolationAppendSink,
} from "@automovie/interface";

/*
 * Report every link that closes a cycle in a graph of declared ids.
 *
 * Nodes are visited depth first in declaration order, following each node's
 * `links` in order. A link to a node still on the current path closes a cycle
 * and pushes one `type` violation with `message` at that target node's `path`,
 * carrying its `value`. A link naming no node is skipped, because the dangling
 * reference is reported on its own path, and a node already finished is not
 * walked again. Ids are matched by string equality; when two nodes share an id,
 * the later one stands for it.
 *
 * The walk keeps its own stack instead of recursing, so a chain as long as the
 * whole graph, such as a revision history thousands deep, cannot overflow the
 * call stack.
 * Parameter nodes: Graph nodes with their outgoing links, the violation path to
 * report a cycle on, and the value to report there.
 * Parameter message: Violation message, such as `design revision graph must be
 * acyclic`.
 * Parameter collector: Sink that receives the violations.
 */
export const appendGraphCycles = (
  nodes: IAutoMovieAppendGraphCycles.INodes,
  message: string,
  collector: IAutoMovieViolationAppendSink,
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

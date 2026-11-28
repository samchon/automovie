import { AutoMovieEngineViolationCollector } from "@automovie/engine";
import {
  appendGraphCycles
} from "../../../../../packages/engine/src/validation/internal/appendGraphCycles";
import type {
  IAutoMovieAppendGraphCycles,
  IAutoMovieConstraintViolation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `appendGraphCycles` reports every link that closes a cycle, at the node the
 * cycle returns to, by a depth-first walk that skips links to undeclared nodes
 * and revisits no finished node.
 *
 * The chain from a passes through b and c and returns to a. Node d links to a,
 * e links to an undeclared target, and f links to itself.
 *
 * Scenarios:
 *
 * 1. The three-node cycle is reported once, at `a`, where the walk from `a`
 *    returns; `d` reaches only finished nodes; `e`'s dangling link is skipped;
 *    the self-link closes at `f`.
 * 2. A chain without cycles reports nothing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers a multi-node return, self-link, repeated reach of an already visited node, dangling link and acyclic chain.
 * @evidence contracts/development/testing.md#behavioral-verification Passes explicit nodes and links to appendGraphCycles with a fresh violation collector, then reads the ordered finding paths.
 * @evidence contracts/development/testing.md#independent-expectations The directed cycle returns to a and the self-link returns to f. The edge from d closes neither cycle, e lacks a declared target, and the second graph is acyclic.
 */
export function test_engine_validation_append_graph_cycles(): void {
  const node = (
    id: string,
    ...links: string[]
  ): IAutoMovieAppendGraphCycles.INodes[number] => ({
    id,
    links,
    path: `$input.${id}`,
    value: id,
  });
  const cycles = (nodes: IAutoMovieAppendGraphCycles.INodes): string[] => {
    const collector: AutoMovieEngineViolationCollector = new AutoMovieEngineViolationCollector();
    appendGraphCycles(nodes, "the graph must be acyclic", collector);
    return collector.items.map(
      (item: IAutoMovieConstraintViolation): string => item.path,
    );
  };
  TestValidator.equals(
    "each cycle once, at the node it returns to",
    [
      cycles([
        node("a", "b"),
        node("b", "c"),
        node("c", "a"),
        node("d", "a"),
        node("e", "missing"),
        node("f", "f"),
      ]),
      cycles([node("a", "b"), node("b", "c"), node("c")]),
    ],
    [["$input.a", "$input.f"], []],
  );
}

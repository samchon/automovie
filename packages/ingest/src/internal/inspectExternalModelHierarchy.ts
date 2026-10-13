import { object } from "./object";
import { optionalArray } from "./optionalArray";

/**
 * Establish a unique-parent acyclic glTF node forest.
 *
 * Index-validated child edges fill one parent table; iterative three-state walks detect cycles and mark completed root paths.
 *
 * @evidence contracts/common.md#principled-implementation Index-validated child edges fill one parent table; iterative three-state walks detect cycles and mark completed root paths.
 * @evidence contracts/common.md#clear-and-simple-design Hierarchy admission runs before profile dispatch so static, humanoid and motion consumers share one forest contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Duplicate children, multiple parents and parent cycles throw without rewriting the graph or dropping links.
 * @evidence contracts/common.md#meaningful-documentation Comments explain index-validation prerequisite, unique parent semantics and depth-safe iterative traversal.
 * @evidence contracts/performance.md#efficient-algorithms N nodes and E child links cost O(N+E), since completed parent walks are marked and each node enters one unfinished path.
 * @evidence contracts/performance.md#reuse-equivalent-work The returned parent table is reused by scene-root admission and motion-node interpretation in the same inspector call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Parent/state/path arrays are bounded by node count; only the returned table remains with its synchronous caller.
 * @author Samchon
 */
export const inspectExternalModelHierarchy: (values: unknown[]) => Array<number | undefined> = (
  values: unknown[],
): Array<number | undefined> => {
  const parentByIndex: Array<number | undefined> = new Array<
    number | undefined
  >(values.length);
  values.forEach((value: unknown, parentIndex: number): void => {
    const node: Record<string, unknown> = object(
      value,
      `nodes[${parentIndex}]`,
    );
    optionalArray(node.children, `nodes[${parentIndex}].children`).forEach(
      (entry: unknown): void => {
        const childIndex: number = entry as number;
        const previous: number | undefined = parentByIndex[childIndex];
        if (previous === parentIndex)
          throw new Error(
            `nodes[${parentIndex}].children repeats node ${childIndex}.`,
          );
        if (previous !== undefined)
          throw new Error(
            `nodes[${childIndex}] has multiple parents ${previous} and ${parentIndex}.`,
          );
        parentByIndex[childIndex] = parentIndex;
      },
    );
  });

  // 0 = unvisited, 1 = on the current walk, 2 = proven to reach a root.
  const state: Uint8Array = new Uint8Array(values.length);
  for (let start: number = 0; start < values.length; ++start) {
    if (state[start] !== 0) continue;
    const path: number[] = [];
    let index: number | undefined = start;
    while (index !== undefined && state[index] === 0) {
      state[index] = 1;
      path.push(index);
      index = parentByIndex[index];
    }
    if (index !== undefined && state[index] === 1)
      throw new Error(`nodes[${index}] belongs to a parent cycle.`);
    for (const entry of path) state[entry] = 2;
  }
  return parentByIndex;
};

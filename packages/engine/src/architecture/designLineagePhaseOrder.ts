import { IAutoMovieDesignLineage } from "@automovie/interface";

import { compareCodeUnits } from "../text/compareCodeUnits";
import { validateDesignLineage } from "./validateDesignLineage";

/**
 * Order the construction plan deterministically.
 *
 * The plan is a graph, so many orders satisfy it and the authoring order is not
 * one of them: reordering a source array must not reorder a schedule. Ready
 * phases are therefore taken in ascending id order, which makes the answer a
 * function of the plan alone.
 *
 * Returns every phase id once, each after all of its `requires`. An invalid
 * lineage, including a cyclic plan, throws an `Error` before ordering.
 *
 * @evidence contracts/common.md#principled-implementation A topological sort that always emits the smallest ready id by code unit, i.e. the lexicographically least valid order; validation guarantees an acyclic plan with resolvable prerequisites, which is why the non-null `find` always succeeds.
 * @evidence contracts/common.md#clear-and-simple-design One sorted pending list and an emitted set, with no priority-queue structure, because construction plans hold a handful of phases; validation is delegated to `validateDesignLineage` through a private copy of the shared `requireValidLineage` helper.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The tie-break is the documented code-unit order, not authoring order or any named phase, and the code relies on validation instead of guarding against a cycle a second time.
 * @evidence contracts/common.md#meaningful-documentation States why authoring order is excluded, the ascending-id tie-break, that every phase appears once after its prerequisites, and the refusal.
 * @evidence contracts/performance.md#cost-and-resources After one full validation it rescans the sorted pending list for each emitted phase, O(P² + P·R) for P phases and R prerequisite edges, where Kahn's algorithm with a min-heap would be O((P + R) log P), a gap that matters only beyond authored plan sizes; nothing is cached or retained.
 */
export const designLineagePhaseOrder = (
  lineage: IAutoMovieDesignLineage,
): string[] => {
  requireValidLineage(lineage);
  const pending = [...lineage.phases].sort((a, b) =>
    compareCodeUnits(a.id, b.id),
  );
  const emitted = new Set<string>();
  const order: string[] = [];
  while (order.length < pending.length) {
    const next = pending.find(
      (phase) =>
        !emitted.has(phase.id) &&
        phase.requires.every((required) => emitted.has(required)),
    )!;
    emitted.add(next.id);
    order.push(next.id);
  }
  return order;
};

const requireValidLineage = (lineage: IAutoMovieDesignLineage): void => {
  const validated = validateDesignLineage({ lineage });
  if (validated.success === false) {
    const first = validated.violations[0]!;
    throw new Error(
      `design lineage "${lineage.id}" is invalid at ${first.path}: ${first.expected}`,
    );
  }
};

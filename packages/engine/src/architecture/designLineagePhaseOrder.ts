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

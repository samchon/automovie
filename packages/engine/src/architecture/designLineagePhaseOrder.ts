import { IAutoMovieDesignLineage } from "@automovie/interface";
import { compareCodeUnits } from "../text/compareCodeUnits";

/**
 * Order the construction plan deterministically.
 *
 * The plan is a graph, so many orders satisfy it and the authoring order is not
 * one of them: reordering a source array must not reorder a schedule. Ready
 * phases are therefore taken in ascending id order, which makes the answer a
 * function of the plan alone.
 *
 * @evidence requirements/production-design/continuity-change-and-deliverables.md#production-design-change-impact `designLineagePhaseOrder` orders the construction plan deterministically. This ensures revision changes expose every affected design consumer.
 * @evidence specifications/narrative-and-intent/budgets-continuity-and-deliverables.md#narrative-intent-design-change-impact-comparison `designLineagePhaseOrder` topologically orders construction phases with stable id ordering for simultaneously ready phases.
 * @evidence requirements/map/temporal-change.md#map-state-validity-phase-order `designLineagePhaseOrder` returns a deterministic prerequisite order for every declared phase and refuses a lineage whose phase graph cannot be resolved.
 * @evidence specifications/world-and-site/temporal-state-and-staleness.md#world-site-existing-change-demolition The stable topological order supplies the phase sequence used to distinguish existing, installed, and removed world identities.
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

/** Every phase that must complete strictly before the given one.  * @evidence requirements/production-design/continuity-change-and-deliverables.md#production-design-change-impact `validateDesignLineage` validates one lineage record as a self-consistent phase, alternative, and derivation graph. This ensures revision changes expose every affected design consumer.
 * @evidence specifications/narrative-and-intent/budgets-continuity-and-deliverables.md#narrative-intent-design-change-impact-comparison `validateDesignLineage` performs design lineage validation when the engine compares revisions and walks shared design dependencies.
 * @author Samchon
 */
export const phasesBefore = (
  lineage: IAutoMovieDesignLineage,
  phase: string,
): Set<string> => {
  const byId = new Map(
    lineage.phases.map((entry) => [entry.id, entry] as const),
  );
  const before = new Set<string>();
  const queue = [...byId.get(phase)!.requires];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (before.has(current)) continue;
    before.add(current);
    // A prerequisite naming no phase is reported on its own path; walking it
    // further would only repeat that one defect as an ordering complaint.
    const next = byId.get(current);
    if (next !== undefined) queue.push(...next.requires);
  }
  return before;
};

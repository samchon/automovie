/**
 * Shared by designLineagePhaseOrder, designLineagePhaseSnapshot, designLineageCompare, designLineageDecisionComparisons, designLineageImpact, designLineageDigest, designLineageViewDigest, which were one file until each public identity took its own.
 *
 * @evidence requirements/production-design/continuity-change-and-deliverables.md#production-design-change-impact `validateDesignLineage` validates one lineage record as a self-consistent phase, alternative, and derivation graph. This ensures revision changes expose every affected design consumer.
 * @evidence specifications/narrative-and-intent/budgets-continuity-and-deliverables.md#narrative-intent-design-change-impact-comparison `validateDesignLineage` performs design lineage validation when the engine compares revisions and walks shared design dependencies.
 * @author Samchon
 */
export const requireValidLineage = (lineage: IAutoMovieDesignLineage): void => {
  const validated = validateDesignLineage({ lineage });
  if (validated.success === false) {
    const first = validated.violations[0]!;
    throw new Error(
      `design lineage "${lineage.id}" is invalid at ${first.path}: ${first.expected}`,
    );
  }
};

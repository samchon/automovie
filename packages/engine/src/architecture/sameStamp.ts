/**
 * Shared by validateDesignLineage, designLineageViewDigest, which were one file until each public identity took its own.
 *
 * @evidence requirements/production-design/continuity-change-and-deliverables.md#production-design-change-impact `validateDesignLineage` validates one lineage record as a self-consistent phase, alternative, and derivation graph. This ensures revision changes expose every affected design consumer.
 * @evidence specifications/narrative-and-intent/budgets-continuity-and-deliverables.md#narrative-intent-design-change-impact-comparison `validateDesignLineage` performs design lineage validation when the engine compares revisions and walks shared design dependencies.
 * @author Samchon
 */
export const sameStamp = (
  a: IAutoMovieDesignStamp,
  b: IAutoMovieDesignStamp,
): boolean =>
  a.revision === b.revision &&
  a.variant === b.variant &&
  a.phase === b.phase &&
  a.configuration === b.configuration;

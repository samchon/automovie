/**
 * Shared by validateDesignLineage, designLineageViewDigest, which were one file until each public identity took its own.
 *
 * @evidence requirements/production-design/continuity-change-and-deliverables.md#production-design-change-impact `validateDesignLineage` validates one lineage record as a self-consistent phase, alternative, and derivation graph. This ensures revision changes expose every affected design consumer.
 * @evidence specifications/narrative-and-intent/budgets-continuity-and-deliverables.md#narrative-intent-design-change-impact-comparison `validateDesignLineage` performs design lineage validation when the engine compares revisions and walks shared design dependencies.
 * @author Samchon
 */
export const appendCycles = (
  nodes: readonly { id: string; links: readonly string[]; path: string }[],
  label: string,
  collector: ViolationCollector,
): void => {
  const byId = new Map(nodes.map((node) => [node.id, node] as const));
  const states = new Map<string, "visiting" | "visited">();
  const visit = (node: {
    id: string;
    links: readonly string[];
    path: string;
  }): void => {
    const state = states.get(node.id);
    if (state === "visited") return;
    if (state === "visiting") {
      collector.push(
        "type",
        node.path,
        `${label} graph must be acyclic`,
        node.links,
      );
      return;
    }
    states.set(node.id, "visiting");
    for (const link of node.links) {
      const next = byId.get(link);
      if (next !== undefined) visit(next);
    }
    states.set(node.id, "visited");
  };
  nodes.forEach(visit);
};

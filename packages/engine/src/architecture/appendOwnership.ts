/**
 * Shared by validateBuiltEnvironment, builtConnectorSection, which were one file until each public identity took its own.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `validateBuiltEnvironment` validates the graph, geometry references, and spatial topology of a building. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `validateBuiltEnvironment` performs built environment validation when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
 * @author Samchon
 */
export const appendOwnership = <T extends { id: string; parent: string | null }>(
  records: readonly T[],
  roots: ReadonlySet<string>,
  path: string,
  label: string,
  rootLabel: string,
  collector: ViolationCollector,
): void => {
  const byId = new Map(records.map((record) => [record.id, record]));
  records.forEach((record, index) => {
    const seen = new Set<string>([record.id]);
    let current: T = record;
    while (current.parent !== null) {
      const parent = byId.get(current.parent);
      // A dangling or cyclic parent is already reported on its own path, and
      // walking it further would only repeat that one defect as an ownership
      // gap the author cannot act on.
      if (parent === undefined || seen.has(parent.id)) return;
      seen.add(parent.id);
      current = parent;
    }
    if (!roots.has(current.id))
      collector.push(
        "type",
        `${path}[${index}].parent`,
        `${label} "${record.id}" belongs to no building unit; its topmost ${label} "${current.id}" must be declared as some building unit's ${rootLabel}`,
        record.parent,
      );
  });
};

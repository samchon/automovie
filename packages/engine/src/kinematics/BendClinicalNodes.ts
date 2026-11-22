/**
 * Private identities of the default clinical tables, recorded before exposure.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the native chart ownership and when it is recorded.
 * @evidence contracts/development/design.md#principled-representation Weak identity admission separates authority from the current, mutable clinical numbers.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The three chart allocators issue records and the numeric clinical reader checks them. This module is absent from the public barrels.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Foreign nodes cannot acquire the engine chart's authority by matching its shape or values.
 */
export namespace BendClinicalNodes {
  /** The engine's allocated chart nodes. */
  const NODES: WeakSet<object> = new WeakSet();

  /**
   * Record the identities of one freshly allocated built-in clinical table.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Requires a newly allocated chart and records only its nodes.
   * @evidence contracts/development/implementation.md#principled-implementation Traverse the ordinary records at the actual allocation boundary, before export consumers can replace fields.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A weak identity traversal visits each object once.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No record is frozen and no scalar chart value is retained.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the number of links in the three constant charts, once at allocation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Repeated clinical readers can authenticate current nodes without exploring unknown replacements.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Weak identities do not retain the chart.
   */
  export function record(value: unknown): void {
    if (typeof value !== "object" || value === null || NODES.has(value)) return;
    NODES.add(value);
    for (const child of Object.values(value)) record(child);
  }

  /**
   * Identify a node from an original engine chart by identity alone.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the returned identity predicate.
   * @evidence contracts/development/implementation.md#principled-implementation Use the actual allocation receipt before inspecting the candidate.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A type check and weak identity lookup.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unknown records are not traversed.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The scalar clinical reader uses the original authority before checking current values.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function owns(value: unknown): value is object {
    return typeof value === "object" && value !== null && NODES.has(value);
  }
}

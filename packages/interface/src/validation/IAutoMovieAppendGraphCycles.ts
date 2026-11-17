/**
 * Ordered graph projection consumed by the common directed-cycle reporter.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Ordered graph projection consumed by the common directed-cycle reporter. Nested contracts define the relevant units, ownership and failure states.
 * @evidence contracts/development/design.md#principled-representation Text ids and ordered outgoing references are separate from raw diagnostic path/value payloads.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Lineage and hierarchy validators project their records for one common cycle traversal.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Cycle detection does not replace shape, uniqueness or dangling-reference admission.
 */
export namespace IAutoMovieAppendGraphCycles {
  /**
   * Borrowed graph nodes visited by iterative depth-first traversal in declaration/link order. appendGraphCycles appends one type finding for each edge to a currently visiting id at the target node's path, retaining its value. Nodes and links are not mutated.
   *
   * Unknown links are skipped because reference admission belongs to the caller. Ids match exactly. With duplicate ids, link lookup uses the last declaration but outer traversal can start the first declaration; visited state is keyed by id, so uniqueness must be checked separately. Collector exceptions propagate and earlier findings remain appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines traversal, reporting ownership, dangling/duplicate behavior and collector failure effects.
   * @evidence contracts/development/design.md#principled-representation Stable text ids define graph identity while path/value retain the caller's diagnostic location and raw evidence.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Revision lineage and building hierarchy validators project their existing records into this graph without transferring their domain models.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts unknown is intentional diagnostic payload, not an admitted graph value; shape, uniqueness and dangling-link checks remain outside this cycle-only operation.
   */
  export type INodes = readonly {
    /** Exact identity used for visited-state and outgoing reference lookup. */
    id: string;

    /** Ordered outgoing target ids; empty means no edges and missing targets are skipped. */
    links: readonly string[];

    /** Finding path used when this node is the target of a back edge, rather than the source edge's location. */
    path: string;

    /** Unchecked offending payload passed by reference to the collector and potentially retained by its findings. */
    value: unknown;
  }[];
}

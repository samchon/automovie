/** One sheet's canonical source-cell and boundary incidence, before attribute compaction.
 *
 *
 * @evidence contracts/common.md#principled-implementation Canonical structured cell corners and perimeter retain original source incidence before attribute compaction.
 * @evidence contracts/common.md#clear-and-simple-design createHumanFacePeriocularTopology supplies one identical quotient to shell and mapping owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Topology does not infer physical endpoints from coordinate proximity.
 * @evidence contracts/common.md#meaningful-documentation Fields identify cell corner order and original perimeter after the same endpoint quotient.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFacePeriocularTopology is an erased geometry/source contract; its concrete producer or reader owns actual algorithms and population traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFacePeriocularTopology declares correspondence only; its concrete owner decides geometry copies, shared readings and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFacePeriocularTopology acquires no runtime buffer, handle or task; concrete builders/readers own referenced arrays and optional callback retention.
 *
 * @author Samchon
 */
export interface IHumanFacePeriocularTopology {
  /** Canonical a,b,c,d source corners of every original structured cell. */
  cells: [number, number, number, number][];

  /** Original perimeter order after the same source endpoint quotient. */
  perimeter: number[];
}

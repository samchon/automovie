/** Two source-attached sheets and their structured support, without changing dimensions.
 *
 *
 * @evidence contracts/common.md#principled-implementation Two requested metric sheets retain their actual structured support and declared endpoint quotients.
 * @evidence contracts/common.md#clear-and-simple-design The tissue builder owns offsets and the canonical shell/topology owners close the same incidence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only source-declared endpoint columns collapse; unrelated projection collapse is not silently repaired.
 * @evidence contracts/common.md#meaningful-documentation Fields state metre sheets, row/column counts and explicit collapsed identities.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFacePeriocularShellInput is an erased geometry/source contract; its concrete producer or reader owns actual algorithms and population traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFacePeriocularShellInput declares correspondence only; its concrete owner decides geometry copies, shared readings and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFacePeriocularShellInput acquires no runtime buffer, handle or task; concrete builders/readers own referenced arrays and optional callback retention.
 *
 * @author Samchon
 */
export interface IHumanFacePeriocularShellInput {
  /** Outer sheet positions in canonical head-frame metres. */
  outer: number[];

  /** Inner sheet at the original requested thickness, metres. */
  inner: number[];

  /** Columns and rows of each sheet. */
  stride: number;

  /** Rows of each sheet. */
  height: number;

  /** Source-declared zero-height endpoints or repeated canonical canthal columns. */
  collapsedColumns: ReadonlySet<number>;
}

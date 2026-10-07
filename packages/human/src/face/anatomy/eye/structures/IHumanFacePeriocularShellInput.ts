/** Two source-attached sheets and their structured support, without changing dimensions.
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

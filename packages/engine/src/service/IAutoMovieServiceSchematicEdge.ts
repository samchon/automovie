/**
 * One run projected onto XZ for serviceNetworkSchematic; y below means world Z.
 *
 * @evidence contracts/development/design.md#principled-representation Projected route points and separately measured three-dimensional length preserve drawing and developed-run quantities without conflating a riser with zero travel.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Run id, endpoint node ids and plan points are enough to draw one edge, with physical length stored beside it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unresolved endpoint ids may remain port ids in the producer; this row does not assert that the source graph was admitted.
 * @evidence contracts/development/common.md#meaningful-documentation States XZ projection, vertical-axis meaning, source ordering, physical length units and unresolved-endpoint limitation.
 */
export interface IAutoMovieServiceSchematicEdge {
  /** Stable segment identity. */
  id: string;
  /** Node the run leaves. */
  from: string;
  /** Node the run enters. */
  to: string;
  /** Projected centre line, in declaration order. */
  points: Array<{ x: number; y: number }>;
  /** Developed length of the **unprojected** centre line, in metres. */
  length: number;
}

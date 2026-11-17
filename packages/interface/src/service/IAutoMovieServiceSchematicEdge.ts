

/**
 * One run projected onto XZ for serviceNetworkSchematic; y below means world Z.
 * New mutable point records and the array are caller-owned; the report does not
 * retain source route point objects or validate their numeric values.
 *
 * @evidence contracts/development/design.md#principled-representation Projected route points and separately measured three-dimensional length preserve drawing and developed-run quantities without conflating a riser with zero travel.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Run id, endpoint node ids and plan points are enough to draw one edge, with physical length stored beside it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unresolved endpoint ids may remain port ids in the producer; this row does not assert that the source graph was admitted.
 * @evidence contracts/development/common.md#meaningful-documentation States XZ projection, vertical-axis meaning, source ordering, physical length units and unresolved-endpoint limitation.
 */
export interface IAutoMovieServiceSchematicEdge {
  /** Stable segment identity. */
  id: string;

  /** Node owning the emitting port, or the authored port id when its owner is unresolved. */
  from: string;

  /** Node owning the receiving port, or the authored port id when its owner is unresolved. */
  to: string;

  /** Projected centre line, in declaration order. */
  points: Array<{
    /** World X coordinate in metres, copied into the plan. */
    x: number;

    /** World Z coordinate in metres; this plan ordinate is not world height. */
    y: number
  }>;

  /** Developed length of the **unprojected** centre line, in metres. */
  length: number;
}

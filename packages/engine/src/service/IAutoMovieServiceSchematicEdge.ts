/**
 * One run projected onto XZ for serviceNetworkSchematic; y below means world Z.
 *
 * @evidence contracts/common.md#principled-implementation Projected route points and separately measured three-dimensional length preserve drawing and developed-run quantities without conflating a riser with zero travel.
 * @evidence contracts/common.md#clear-and-simple-design Run id, endpoint node ids and plan points are enough to draw one edge, with physical length stored beside it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unresolved endpoint ids may remain port ids in the producer; this row does not assert that the source graph was admitted.
 * @evidence contracts/common.md#meaningful-documentation States XZ projection, vertical-axis meaning, source ordering, physical length units and unresolved-endpoint limitation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Edge data performs no route projection or norm; those scans are owned by the schematic producer.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A derived edge represents one current run and stores no cross-run drawing cache or shared computation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The edge owns a new point array and scalar/string fields, without retaining original route points or port records.
 * @author Samchon
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

/**
 * One shaft's insertion region measured from its emitted Float32 root ring. The closed ball permits insertion only at crossing points within it; the remaining original triangles and all witnesses outside it remain measured.
 *
 * @evidence contracts/common.md#principled-implementation Float32 root-ring mean and maximum observed radius define one shaft's local insertion exception.
 * @evidence contracts/common.md#clear-and-simple-design The same ball governs free vertices and strict transverse crossing witnesses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A point inside the ball never exempts a complete connecting triangle or another free witness.
 * @evidence contracts/common.md#meaningful-documentation Centre and radius are head-frame metres derived from eight distinct emitted ring vertices.
 * @evidenceExclude contracts/performance.md#efficient-algorithms readHumanFaceLashClearance measures the ball; this type performs no geometry calculation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One measured insertion ball is reused for that shaft's vertices and triangle witnesses.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The clearance call owns these small records while final copied witness details belong to returned readings.
 *
 * @author Samchon
 */
export interface IHumanFaceLashInsertionBall {
  /** Mean of the eight distinct root ring vertices, in head-frame metres. */
  centre: readonly number[];

  /** Maximum emitted root-ring vertex distance from the centre, in metres. */
  radius: number;
}

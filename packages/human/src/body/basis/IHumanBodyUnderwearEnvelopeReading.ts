/**
 * One reading of the shared union-of-qualified-balls envelope.
 *
 * @evidence contracts/common.md#principled-implementation Represented nearest-center distance, owned center coordinates and the radial difference divided by that distance describe the selected qualified-ball branch; represented zero distance selects the zero gradient.
 * @evidence contracts/common.md#clear-and-simple-design Scalar value and derivative direction remain together for the fitting consumer's same point query.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A represented zero distance can include squared-distance underflow away from an exact center; a point reading supplies no certified real-arithmetic gradient or whole-face acceptance.
 * @evidence contracts/common.md#meaningful-documentation Members give represented meter distance, posed-frame owned center and the zero-distance branch's numerical meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Point-reading typing performs no nearest-center traversal or distance differentiation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A point result records one active branch without implementing a query cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned scalar/vector metadata acquires no center hierarchy or persistent fitting state.
 * @author Samchon
 */
export interface IHumanBodyUnderwearEnvelopeReading {
  /** Distance to the nearest qualified centre, metres. */
  distance: number;

  /** Owned nearest-centre coordinates, metres in the posed frame. */
  centre: number[];

  /** Radial difference divided by represented distance; zero when that distance is zero, including squared-distance underflow. */
  gradient: number[];
}

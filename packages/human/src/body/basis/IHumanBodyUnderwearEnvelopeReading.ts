/**
 * One reading of the shared union-of-qualified-balls envelope.
 *
 * @evidence contracts/common.md#principled-implementation Nearest-center distance, owned center coordinates and its unit gradient preserve the selected branch of the qualified-ball scalar field.
 * @evidence contracts/common.md#clear-and-simple-design Scalar value and derivative direction remain together for the fitting consumer's same point query.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero gradient is confined to a center and a nearest-distance reading cannot itself certify a whole material face.
 * @evidence contracts/common.md#meaningful-documentation Members give meter distance, posed-frame owned center and center-degenerate gradient meaning.
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

  /** Unit distance gradient; zero only at a centre itself. */
  gradient: number[];
}

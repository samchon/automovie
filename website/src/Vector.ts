

/**
 * Cartesian world coordinates in meters for source observation poses.
 *
 * @evidence contracts/common.md#principled-implementation Named XYZ fields match the temple and future-house source observations; the exporter copies them to Point order without changing units.
 * @evidence contracts/common.md#clear-and-simple-design One structural record expresses the source vector boundary without introducing a runtime vector class.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The fields describe source coordinates uniformly without fixture-specific values or coercion.
 * @evidence contracts/common.md#meaningful-documentation Each member identifies its world axis and meter unit; Y is height.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased coordinate record executes no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This record defines no cache or coordinating operation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This type acquires no handles or tasks.
 */
export type Vector = {
  /** World X coordinate in meters. */
  x: number;

  /** World Y height in meters. */
  y: number;

  /** World Z coordinate in meters. */
  z: number;
};

/**
 * External reference display geometry, kept outside the reconstruction consumer.
 *
 * @evidence contracts/common.md#principled-implementation Millimetre triples and triangle addressing identify the independent reference display input.
 * @evidence contracts/common.md#clear-and-simple-design One source field separates adopted display bytes from engine-generated artifacts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record makes no reconstructed geometry or population-equation claim.
 * @evidence contracts/common.md#meaningful-documentation The source member states units and its reference-only ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This data shape selects no traversal or numerical algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This data shape coordinates no cache or repeated operation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no native handle or running task; its producer owns retained values.
 *
 * @author Samchon
 */
export interface ViewerInput {
  /** Millimetre triples and original triangle indices are retained only for the independent reference viewport. */
  source: { vertices: number[][]; triangles: number[][]; normals?: number[][] };
}



/**
 * A source-to-output value range, the JSON-safe form of a `[from, to]` pair.
 *
 * @evidence contracts/common.md#principled-implementation Named from and to fields preserve endpoint order when toEnginePropSpec creates an engine two-element range; the type imposes no numeric admission by itself.
 * @evidence contracts/common.md#clear-and-simple-design LegacyDrivenDriver owns optional input/output ranges and the converter owns tuple lowering.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Endpoints are neither sorted nor clamped, so descending ranges and absent ranges retain authored meaning for engine admission.
 * @evidence contracts/common.md#meaningful-documentation States endpoint order and the pair representation crossing the stored boundary.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Declaring endpoints performs neither tuple allocation nor interpolation; conversion and driver evaluation own those operations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The ordered pair is input data with no independently cached numerical output to reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Two numeric fields hold no buffers or tasks and belong to their containing driven-driver record.
 * @author Samchon
 */
export interface IAutoMovieLegacyRange {
  /**
   * Range start.
   */
  from: number;

  /**
   * Range end.
   */
  to: number;
}

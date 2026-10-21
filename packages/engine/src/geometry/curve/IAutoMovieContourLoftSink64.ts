import type { IAutoMovieCurve64 } from "./IAutoMovieCurve64";

/**
 * Synchronous destination for one source-free contour kernel invocation.
 * Callback exceptions propagate unchanged and never become a numerical partial.
 * The sink owns capacity admission, storage and any file lifecycle it acquires.
 *
 * @evidence contracts/common.md#principled-implementation Original index, face order and millimetre generating vectors reach one explicit channel owner.
 * @evidence contracts/common.md#clear-and-simple-design Vertex, triangle and generating-curve delivery remain separate from kernel correspondence and metadata.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source geometry, alternate normal or positional alias enters through this output-only contract.
 * @evidence contracts/common.md#meaningful-documentation Members state units, synchronous borrowing, original ordering and callback failure propagation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased callback contract chooses no storage algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The generating invocation owns shared identities once.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrowed vectors and curve points must be consumed synchronously or copied into paid sink storage; the contract owns no hidden buffer or handle.
 */
export interface IAutoMovieContourLoftSink64 {
  /**
   * Consume one original indexed position in millimetres before any face uses it.
   *
   * @evidence contracts/common.md#principled-implementation The kernel delivers its original ordinal and millimetre vector before dependent triangles.
   * @evidence contracts/common.md#clear-and-simple-design One synchronous callback separates geometry computation from storage.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The callback grants no coordinate welding, source fallback or alternate vertex authority.
   * @evidence contracts/common.md#meaningful-documentation States ordering, units and synchronous borrowed input; callback exceptions propagate unchanged.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This erased callback signature chooses no storage algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The invocation already owns shared vertex ordinals.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The vector is borrowed for this call; retained copies and capacity belong to the sink.
   */
  vertex: (index: number, pointMm: IAutoMovieCurve64.Vector) => void;

  /**
   * Consume one face in original face and corner order; every index was delivered.
   *
   * @evidence contracts/common.md#principled-implementation Ordered corners preserve the original indexed face and normal-reduction sequence.
   * @evidence contracts/common.md#clear-and-simple-design Three previously delivered ordinals identify one face without another geometry buffer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The signature grants no face removal, reorder or positional re-identification.
   * @evidence contracts/common.md#meaningful-documentation States index availability and original ordering; callback exceptions propagate unchanged.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This erased callback signature chooses no accumulation or storage algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Ordinals reuse positions already delivered by vertex.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Scalar indices are synchronous inputs; any retained triangle storage belongs to the sink.
   */
  triangle: (a: number, b: number, c: number) => void;

  /**
   * Consume one actual closed generating ring. Positions and phase lookup are
   * borrowed synchronously; position inputs remain in millimetres.
   *
   * @evidence contracts/common.md#principled-implementation The original generating ring and its phase lookup reach the same invocation's construction channel.
   * @evidence contracts/common.md#clear-and-simple-design One callback supplies the ring identity, ordered points and existing phase function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts These are actual generating points, never source geometry or a fabricated substitute for emitted faces.
   * @evidence contracts/common.md#meaningful-documentation States closed-ring meaning, units and borrowing; callback exceptions propagate unchanged.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This erased signature chooses no serialization or phase-search implementation.
   * @evidence contracts/performance.md#reuse-equivalent-work It exposes the kernel's existing phase lookup rather than rebuilding correspondence.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Points and lookup are valid only during synchronous delivery; copied construction records require sink-owned capacity.
   */
  construction: (
    id: string,
    pointsMm: readonly IAutoMovieCurve64.Vector[],
    phase: (pointMm: IAutoMovieCurve64.Vector) => number,
  ) => void;
}

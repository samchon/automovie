import type { IAutoMovieCurve64 } from "./IAutoMovieCurve64";

/**
 * Synchronous destination for one source-free contour kernel invocation.
 * Callback exceptions propagate unchanged and never become a numerical partial.
 * The sink owns capacity admission, storage and any file lifecycle it acquires.
 *
 * @evidence contracts/development/design.md#principled-representation Original index, face order and millimetre generating vectors reach one explicit channel owner.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Vertex, triangle and generating-curve delivery remain separate from kernel correspondence and metadata.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No source geometry, alternate normal or positional alias enters through this output-only contract.
 * @evidence contracts/development/common.md#meaningful-documentation Members state units, synchronous borrowing, original ordering and callback failure propagation.
 */
export interface IAutoMovieContourLoftSink64 {
  /**
   * Consume one original indexed position in millimetres before any face uses it.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The kernel delivers its original ordinal and millimetre vector before dependent triangles.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One synchronous callback separates geometry computation from storage.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The callback grants no coordinate welding, source fallback or alternate vertex authority.
   * @evidence contracts/development/common.md#meaningful-documentation States ordering, units and synchronous borrowed input; callback exceptions propagate unchanged.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This erased callback signature chooses no storage algorithm.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The invocation already owns shared vertex ordinals.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The vector is borrowed for this call; retained copies and capacity belong to the sink.
   */
  vertex: (index: number, pointMm: IAutoMovieCurve64.Vector) => void;

  /**
   * Consume one face in original face and corner order; every index was delivered.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Ordered corners preserve the original indexed face and normal-reduction sequence.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three previously delivered ordinals identify one face without another geometry buffer.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The signature grants no face removal, reorder or positional re-identification.
   * @evidence contracts/development/common.md#meaningful-documentation States index availability and original ordering; callback exceptions propagate unchanged.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This erased callback signature chooses no accumulation or storage algorithm.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Ordinals reuse positions already delivered by vertex.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Scalar indices are synchronous inputs; any retained triangle storage belongs to the sink.
   */
  triangle: (a: number, b: number, c: number) => void;

  /**
   * Consume one actual closed generating ring. Positions and phase lookup are
   * borrowed synchronously; position inputs remain in millimetres.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The original generating ring and its phase lookup reach the same invocation's construction channel.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One callback supplies the ring identity, ordered points and existing phase function.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts These are actual generating points, never source geometry or a fabricated substitute for emitted faces.
   * @evidence contracts/development/common.md#meaningful-documentation States closed-ring meaning, units and borrowing; callback exceptions propagate unchanged.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This erased signature chooses no serialization or phase-search implementation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work It exposes the kernel's existing phase lookup rather than rebuilding correspondence.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Points and lookup are valid only during synchronous delivery; copied construction records require sink-owned capacity.
   */
  construction: (
    id: string,
    pointsMm: readonly IAutoMovieCurve64.Vector[],
    phase: (pointMm: IAutoMovieCurve64.Vector) => number,
  ) => void;
}

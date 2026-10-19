import type { AutoMovieBernsteinAlgebra64 as B } from "./AutoMovieBernsteinAlgebra64";
import type { IAutoMovieCurve64 } from "./IAutoMovieCurve64";

type Counts = {
  cells: number;
  vertices: number;
  triangles: number;
  omittedZeroAreaTriangles: number;
  unresolvedVertexNormals: number;
  maxErrorBoundMm: number;
};
type FaceRange = {
  patch: string;
  u0: number;
  u1: number;
  t0: number;
  t1: number;
  triangleStart: number;
  triangleCount: number;
  omittedZeroAreaTriangles: number;
};

/**
 * Immutable input and append-only output records for the physical Hermite stream.
 *
 * @evidence contracts/common.md#principled-implementation The structural record retains the original coefficient, phase and physical identity fields.
 * @evidence contracts/common.md#clear-and-simple-design This type owner separates immutable contracts from numerical execution.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A type does not supply geometry, weld positions or certify source fidelity.
 * @evidence contracts/common.md#meaningful-documentation Members state their units, ownership and local diagnostic scope.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A type performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A type owns no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns all arrays and records.
 */
export namespace IAutoMovieLocalHermiteStream64 {
  /**
   * Immutable normalized mm courses, increasing physical mm stations and explicit budgets.
   *
   * @evidence contracts/common.md#principled-implementation Physical and phase charts remain distinct in the input record.
   * @evidence contracts/common.md#clear-and-simple-design One input record owns the run and resource policy.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No source triangle or fallback geometry is accepted.
   * @evidence contracts/common.md#meaningful-documentation The operator documents tolerance, charts and immutable input lifetime.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A type performs no computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A type owns no cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A type retains no runtime input.
   */
  export type Input = {
    /** Stable semantic run name. */
    name: string;
    /** Physical identity scope for this immutable generated run. */
    topologyDomain: string;
    /** Increasing physical station coordinates, millimetres. */
    stations: readonly number[];
    /** Complete millimetre courses with normalized phase. */
    courses: readonly IAutoMovieCurve64.Cubic[];
    /** Positive field-to-PL approximation request, millimetres. */
    toleranceMm: number;
    /** Positive retained adaptive leaf budget per station interval. */
    maxCellsPerInterval: number;
    /** Positive bounded chunk capacity, at least three vertices. */
    maxVerticesPerChunk: number;
    /** Explicit physical interpolation; omitted selects quadratic. */
    stationInterpolation?: "quadratic" | "ruled";
    /** First global output index; omitted selects zero. */
    vertexOffset?: number;
  };

  /**
   * Newly published metre vertices and global indices; previous chunk vertices may be referenced.
   *
   * @evidence contracts/common.md#principled-implementation Each index names an already published or current vertex; face ranges use chunk-relative triangle ordinals.
   * @evidence contracts/common.md#clear-and-simple-design Geometry, source-free identity and diagnostic attribution travel together.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Independent sheets are separated by topologyDomain rather than coordinate welding.
   * @evidence contracts/common.md#meaningful-documentation States indexing, metre units and consumer ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The record performs no computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Boundary reuse belongs to the generator.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The consumer releases each transferred chunk.
   */
  export type Chunk = {
    /** Owning physical station interval index. */
    interval: number;
    /** First global index of this newly published vertex suffix. */
    vertexStart: number;
    /** New model-metre positions. */
    positions: number[];
    /** Own analytic normals aligned with published positions. */
    normals: number[];
    /** Source-free logical generated position identities. */
    physicalVertexIds: string[];
    /** Global indices into this and previously published chunks. */
    indices: number[];
    /** Actual saved-course construction in model metres. */
    construction: { id: string; closed: false; points: B.Vec[] }[];
    /** Local failures and independent qualification messages. */
    diagnostics: string[];
    /** Actual retained work, output and arithmetic counts. */
    counts: Counts;
    /** Local analytic patch attribution with chunk-relative triangle offsets. */
    faceRanges: FaceRange[];
  };

  /**
   * Complete-run counts and explicit interval limitations, returned after the last chunk.
   *
   * @evidence contracts/common.md#principled-implementation Summary counts describe published output, not source fidelity.
   * @evidence contracts/common.md#clear-and-simple-design A final record separates completion from per-chunk data.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted intervals keep explicit reasons.
   * @evidence contracts/common.md#meaningful-documentation States count scope and final-return semantics.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The record performs no computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record owns no cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only limitation strings and scalar totals survive generator completion.
   */
  export type Summary = {
    /** Admitted station interval count. */
    intervals: number;
    /** Intervals containing unresolved or unprocessed regions. */
    omittedIntervals: number;
    /** Actual published render vertex count. */
    vertices: number;
    /** Actual retained triangle count. */
    triangles: number;
    /** Final explicit interval and arithmetic limitations. */
    diagnostics: string[];
  };
}

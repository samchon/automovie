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
 * @evidence contracts/development/common.md#meaningful-documentation Members state their units, ownership and local diagnostic scope.
 * @evidence contracts/development/design.md#principled-representation Represents Immutable input and append-only output records for the physical Hermite stream: companion namespace of 3 members (`Input`, `Chunk`, `Summary`); units and frames named in its text: metre, metres, local. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IAutoMovieLocalHermiteStream64` in packages/engine/src/geometry/curve/IAutoMovieLocalHermiteStream64.ts; its surface is the 3 members listed and the text shows 1 other file naming it, mostly packages/engine (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace IAutoMovieLocalHermiteStream64 {
  /**
   * Immutable normalized mm courses, increasing physical mm stations and explicit budgets.
   *
   * @evidence contracts/development/design.md#principled-representation Physical and phase charts remain distinct in the input record.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One input record owns the run and resource policy.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No source triangle or fallback geometry is accepted.
   * @evidence contracts/development/common.md#meaningful-documentation The operator documents tolerance, charts and immutable input lifetime.
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
   * @evidence contracts/development/design.md#principled-representation Each index names an already published or current vertex; face ranges use chunk-relative triangle ordinals.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Geometry, source-free identity and diagnostic attribution travel together.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Independent sheets are separated by topologyDomain rather than coordinate welding.
   * @evidence contracts/development/common.md#meaningful-documentation States indexing, metre units and consumer ownership.
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
   * @evidence contracts/development/design.md#principled-representation Summary counts describe published output, not source fidelity.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A final record separates completion from per-chunk data.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Omitted intervals keep explicit reasons.
   * @evidence contracts/development/common.md#meaningful-documentation States count scope and final-return semantics.
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

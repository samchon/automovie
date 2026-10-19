import { AutoMovieBernsteinAlgebra64 as B } from "./AutoMovieBernsteinAlgebra64";
import { AutoMovieCanonicalBoundary64 as Q } from "./AutoMovieCanonicalBoundary64";
import { prepareAutoMovieBicubicAtlasBoundary64 } from "./prepareAutoMovieBicubicAtlasBoundary64";
import type { tessellateAutoMovieBicubicAtlas64 } from "./tessellateAutoMovieBicubicAtlas64";

type Patch = {
  /** Unique patch address in this atlas. */
  id: string;
  /** Sixteen coefficient registry addresses, v rows then u columns. */
  controlIds: readonly number[];
};
type AtlasInput = tessellateAutoMovieBicubicAtlas64.Input;
type Counts = {
  cells: number;
  retainedCoarseCells: number;
  vertices: number;
  triangles: number;
  omittedZeroAreaTriangles: number;
  unresolvedVertexNormals: number;
  maxErrorBoundMm: number;
};
type Range = {
  patch: string;
  u0: number;
  u1: number;
  v0: number;
  v1: number;
  approximationBoundMm: number;
  triangleStart: number;
  triangleCount: number;
  omittedZeroAreaTriangles: number;
};
type AtlasChunk = tessellateAutoMovieBicubicAtlas64.Chunk;
type AtlasSummary = tessellateAutoMovieBicubicAtlas64.Summary;
type Cell = {
  u0: number;
  u1: number;
  v0: number;
  v1: number;
  grid: B.Grid;
  error: number;
};
type Plan = { grid: B.Grid; cells: Cell[]; diagnostics: string[] };
type Binding =
  ReturnType<
    typeof prepareAutoMovieBicubicAtlasBoundary64
  >["bindings"] extends Map<string, infer Value>
    ? Value
    : never;
type Occurrence = {
  patch: number;
  side: number;
  reverse: boolean;
  requests: Map<string, number>;
  binding?: Binding;
};
type Vertex = { index: number; position: B.Vec };
type Phase = ReturnType<typeof Q.phase>;
type Sample = { u: number; v: number; phase?: Phase; side?: number };
type Edge = {
  key: string;
  ids: number[];
  incidents: Occurrence[];
  phases: Map<string, Phase>;
  samples: Phase[];
  roundedCollisions: number;
  vertices: Map<number, Vertex>;
  owner: Occurrence;
  last: number;
};
type Corner = {
  owner: { patch: number; u: number; v: number };
  position: B.Vec;
  last: number;
  vertex?: Vertex;
};
/**
 * Internal atlas phase records preserve the public generator contracts and shared identity state.
 *
 * @evidence contracts/common.md#principled-implementation The records retain the original patch, cell, edge, corner and exact-phase structures.
 * @evidence contracts/common.md#clear-and-simple-design This phase retains its original arithmetic and ordered state transitions while its caller owns orchestration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Extraction introduces no input correction, geometry fallback, reordered reduction or changed admission condition.
 * @evidence contracts/common.md#meaningful-documentation States the phase responsibility, shared-state ownership and numerical limits inherited from the calling algorithm.
 * @evidence contracts/performance.md#efficient-algorithms These type declarations perform no computation.
 * @evidence contracts/performance.md#reuse-equivalent-work Every phase names the same internal record shapes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Erased types retain no runtime resources.
 */
export type AutoMovieBicubicAtlasTypes64 = {
  /** Row-major millimetre bicubic chart and its declared orientation. */
  Patch: Patch;

  /** The generator input contract borrowed by internal planning and emission. */
  AtlasInput: AtlasInput;

  /** Actual retained-cell, vertex, triangle and arithmetic qualification counts. */
  Counts: Counts;

  /** One chart-local UV cell and its chunk-relative generated face range. */
  Range: Range;

  /** Append-only metre vertex suffix with global indices and physical identities. */
  AtlasChunk: AtlasChunk;

  /** Terminal scalar counts and incomplete-work diagnostics without geometry buffers. */
  AtlasSummary: AtlasSummary;

  /** Adaptive unit-domain leaf bounds, coefficient grid and measured error estimate. */
  Cell: Cell;

  /** One patch refinement plan, retained cells and local unresolved-work records. */
  Plan: Plan;

  /** Declared canonical cubic interval and independent analytic normal fan. */
  Binding: Binding;

  /** One incident chart direction and its exact requested edge phases. */
  Occurrence: Occurrence;

  /** Generated metre position and its append-only global render index. */
  Vertex: Vertex;

  /** Exact canonical phase identity with a separate binary64 coordinate view. */
  Phase: Phase;

  /** Patch-local UV sample with optional declared edge and exact phase ownership. */
  Sample: Sample;

  /** Canonical edge sample union, incidence and retained generated-vertex registry. */
  Edge: Edge;

  /** Canonical endpoint position, first incident owner and shared vertex lifetime. */
  Corner: Corner;
};

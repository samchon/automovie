import type { AutoMovieBernsteinGrid64 } from "./AutoMovieBernsteinGrid64";
import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";
import type { IAutoMovieCanonicalBoundaryPhase64 } from "./IAutoMovieCanonicalBoundaryPhase64";
import type { IAutoMoviePrepareBicubicAtlasBoundary64 } from "./IAutoMoviePrepareBicubicAtlasBoundary64";

/**
 * Atlas chart, adaptive-cell and shared-boundary records used by planning and emission.
 *
 * @evidence contracts/development/design.md#principled-representation Chart/grid records use model millimetres and normalized parameters; emitted vertex receipts use model metres and global indices.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Planning, registry and emission share these canonical chart, cell and incidence records.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Exact phase and declared coefficient identities remain separate from rounded positions and render-normal fans.
 * @evidence contracts/development/common.md#meaningful-documentation Member contracts describe units, allocation, cache lifetimes, approximation limits and count scope.
 */
export namespace IAutoMovieBicubicAtlas64 {
  /**
   * One tensor bicubic chart addressed in an immutable coefficient registry.
   *
   * @evidence contracts/development/design.md#principled-representation Sixteen row-major control IDs address millimetre coefficients on normalized u,v; AutoMovieBicubicAtlasPlan64 checks length, safe indices and unique nonempty IDs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Atlas input and every planning/emission stage share this chart identity and coefficient addressing.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shared integer IDs declare coefficient identity; equal coordinates do not infer a join.
   * @evidence contracts/development/common.md#meaningful-documentation States registry scope, row order and the runtime admission owner.
   */
  export type Patch = {
    /** Unique patch address in this atlas. */
    id: string;
    /** Sixteen coefficient registry addresses, v rows then u columns. */
    controlIds: readonly number[];
  };

  /**
   * Actual per-chunk emission counts, freshly allocated with each vertex suffix.
   *
   * @evidence contracts/development/design.md#principled-representation Counts distinguish first-seen cells, new render indices and retained triangles; the maximum Taylor estimate uses millimetres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieBicubicAtlasEmit64 updates these values alongside geometry and diagnostic qualification.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Coarse retention, zero-area omission and zero normals remain separately observable rather than credited as qualified output.
   * @evidence contracts/development/common.md#meaningful-documentation Defines continuation across chunks, finite-area failures and numerical estimate scope.
   */
  export type Counts = {
    /** Retained cells whose first face range begins in this chunk; continuation ranges in later chunks do not count that cell again. */
    cells: number;
    /** First-counted cells in this chunk whose estimate exceeds toleranceMm under retain-coarse policy; continued ranges do not count them again. */
    retainedCoarseCells: number;
    /** Number of newly appended render vertices in this chunk, excluding references to earlier chunks. */
    vertices: number;
    /** Number of retained positive-area triangles emitted into this chunk. */
    triangles: number;
    /** Proposed triangles with exactly zero metre-space area. Nonfinite area instead stops patch emission and adds an arithmetic-unprocessed diagnostic. */
    omittedZeroAreaTriangles: number;
    /** New vertices whose analytic normal could not be normalized; their published normal remains zero. */
    unresolvedVertexNormals: number;
    /** Largest represented cell's binary64 Taylor error estimate in millimetres; zero for an empty accumulator, not an outward-rounded certificate. */
    maxErrorBoundMm: number;
  };

  /**
   * One leaf's chunk-local accepted triangle interval, including collapsed candidates.
   *
   * @evidence contracts/development/design.md#principled-representation Original normalized patch bounds identify a retained cell; triangleStart counts current-chunk triangle triples and the error estimate uses millimetres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The atlas emitter publishes each range beside global indices to retain analytic patch attribution across streaming boundaries.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A zero-triangle range can report omitted collapsed candidates, and over-tolerance coarse estimates are not hidden.
   * @evidence contracts/development/common.md#meaningful-documentation Defines patch ownership, chunk offsets, parameter bounds and approximation limitations.
   */
  export type Range = {
    /** Input patch id owning this emitted range; distinct ids retain distinct chart ownership. */
    patch: string;
    /** Lower normalized u coordinate of the owning retained cell in [0,1]. */
    u0: number;
    /** Upper normalized u coordinate of the owning retained cell in [0,1]. */
    u1: number;
    /** Lower normalized v coordinate of the owning retained cell in [0,1]. */
    v0: number;
    /** Upper normalized v coordinate of the owning retained cell in [0,1]. */
    v1: number;
    /** The owning cell's actual Taylor error estimate in millimetres, including an over-tolerance retained coarse cell. */
    approximationBoundMm: number;
    /** First triangle ordinal within this chunk's index buffer, not a global triangle index. */
    triangleStart: number;
    /** Number of consecutive retained triangles represented by this range. */
    triangleCount: number;
    /** Proposed faces with exactly zero metre-space area while emitting this range; nonfinite arithmetic terminates emission instead. */
    omittedZeroAreaTriangles: number;
  };

  /**
   * Adaptive leaf of a bicubic chart, retained after finite derivative-bound evaluation.
   *
   * @evidence contracts/development/design.md#principled-representation Bounds address the original unit-square patch while the restricted millimetre grid is parameterized on its own unit square.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Atlas planning owns subdivision and emission reads these leaves to build conforming boundaries and error attribution.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Binary64 derivative-control estimates are not outward-rounded certificates; retain-coarse leaves may explicitly exceed tolerance.
   * @evidence contracts/development/common.md#meaningful-documentation Defines grid restriction, row order, estimate units and original parameter bounds.
   */
  export type Cell = {
    /** Lower normalized u bound of this adaptive leaf in the original patch domain. */
    u0: number;
    /** Upper normalized u bound of this adaptive leaf in the original patch domain. */
    u1: number;
    /** Lower normalized v bound of this adaptive leaf in the original patch domain. */
    v0: number;
    /** Upper normalized v bound of this adaptive leaf in the original patch domain. */
    v1: number;
    /** Restricted 4-by-4 tensor Bernstein coefficients in millimetres, indexed by v row then u column. */
    grid: AutoMovieBernsteinGrid64;
    /** Binary64 same-parameter Taylor estimate Muu/8 + Muv/4 + Mvv/8 in millimetres; not an outward-rounded proof. */
    error: number;
  };

  /**
   * Prepared root grid and retained leaves for one input patch. Grid storage can be
   * shared by an unsplit leaf or canonical positions; treat it as immutable during emission.
   *
   * @evidence contracts/development/design.md#principled-representation The root grid remains available even when conflicts or budgets leave no cells; diagnostics distinguish omission from over-tolerance retention.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieBicubicAtlasPlan64 produces one record per input patch for registry construction and analytic vertex evaluation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Empty retained work is not repaired by a proxy patch; conflicting coefficients remain an explicit limitation.
   * @evidence contracts/development/common.md#meaningful-documentation States grid retention, storage sharing and partial-plan diagnostics.
   */
  export type Plan = {
  /** Prepared 4-by-4 coefficient grid in millimetres. It is retained even for an omitted patch; a coefficient-conflict plan keeps the initial constructed grid before side overwrite. */
  grid: AutoMovieBernsteinGrid64;
  /** Retained adaptive leaves only; a split parent does not coexist with its retained children. */
  cells: IAutoMovieBicubicAtlas64.Cell[];
  /** Patch-local admission, budget and approximation limitations retained for terminal reporting. */
  diagnostics: string[] };

  /**
   * Admitted or transported side binding owned by canonical boundary preparation.
   *
   * @evidence contracts/development/design.md#principled-representation Indexed extraction preserves directed normalized authority endpoints and the independent normal-fan identity of the canonical binding owner.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Registry and vertex stages reuse the preparation map's value contract without declaring another binding shape.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Extraction does not widen authority data or erase the optional transported legacy fan distinction.
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the preparation owner and the preserved interval and fan semantics.
   */
  export type Binding =
    IAutoMoviePrepareBicubicAtlasBoundary64.IResult["bindings"] extends Map<string, infer Value>
      ? Value
      : never;

  /**
   * One retained patch-side use in the shared edge registry; mutable requests remain
   * owned by that tessellation invocation and preserve authored local coordinates.
   *
   * @evidence contracts/development/design.md#principled-representation Input patch ordinals and side ordinals identify a chart use; exact canonical keys map to original normalized local samples.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieBicubicAtlasRegistry64 creates occurrences for edge-phase transport and vertex ownership during emission.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An absent binding selects existing four-ID identity rather than inventing a canonical authority from positions.
   * @evidence contracts/development/common.md#meaningful-documentation States index domains, orientation, request-map ownership and absent-binding behavior.
   */
  export type Occurrence = {
    /** Zero-based input patch ordinal, also the deterministic emission order. */
    patch: number;
    /** Patch side ordinal: 0 bottom v=0, 1 right u=1, 2 top v=1, 3 left u=0. */
    side: number;
    /** Whether the legacy control-id edge order reverses this side's increasing local coordinate. */
    reverse: boolean;
    /** Exact canonical phase key to this incident side's original normalized local coordinate; mutable registry owned by the tessellation invocation. */
    requests: Map<string, number>;
    /** Optional declared authority interval and normal fan; absence selects legacy four-control-id identity. */
    binding?: IAutoMovieBicubicAtlas64.Binding;
  };

  /**
   * Cached receipt for an already appended render vertex. Reused receipts may be
   * referenced from later chunks; consumers must preserve the published global index.
   *
   * @evidence contracts/development/design.md#principled-representation The append-only safe integer index includes vertexOffset while Cartesian position is converted from model millimetres to model metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Local, corner, edge and normal-fan caches reuse this receipt for indices and triangle area arithmetic.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Receipt reuse follows declared boundary/fan identity rather than coordinate welding.
   * @evidence contracts/development/common.md#meaningful-documentation States global indexing, position frame and shared receipt lifetime.
   */
  export type Vertex = {
  /** Append-only global render vertex index, including the caller's vertexOffset. */
  index: number;
  /** Generated Cartesian position in model metres, retained for shared incidence reuse; no world transform has been applied. */
  position: AutoMovieVector3Tuple };

  /**
   * Parameter-boundary vertex request, optionally carrying an exact shared phase.
   *
   * @evidence contracts/development/design.md#principled-representation Unit-square coordinates locate the patch while an optional exact phase distinguishes canonical addresses with coincident rounded coordinates.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The emitter passes samples through parameter triangulation to the vertex owner, preserving boundary side and phase attribution.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Optional side and phase refine a local request; absence allows the vertex owner to recover boundary ownership from its registry rather than assuming an interior point.
   * @evidence contracts/development/common.md#meaningful-documentation Defines local coordinates, optional exact identity and side inference.
   */
  export type Sample = {
  /** Normalized coordinate in this patch's u direction, in [0,1]. */
  u: number;
  /** Normalized coordinate in this patch's v direction, in [0,1]. */
  v: number;
  /** Exact boundary phase when explicitly attached by the emitter; absence permits lookup from the side's phase map, including at patch corners. */
  phase?: IAutoMovieCanonicalBoundaryPhase64;
  /** Explicit incident side ordinal 0 through 3; when absent the vertex owner infers touching sides and prefers an explicitly bound one. */
  side?: number };

  /**
   * Per-invocation shared boundary registry with exact requested phases and a legacy
   * render-vertex cache. Canonically bound normal fans use a separate vertex map.
   *
   * @evidence contracts/development/design.md#principled-representation Declared authority or ordered control IDs determine identity; exact dyadic samples remain distinct despite rounded numeric collisions.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Registry construction collects incidents once and emission reuses their union of requests and first legacy owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Neither shared identity nor finite incidence certifies manifoldness, orientation or embedding.
   * @evidence contracts/development/common.md#meaningful-documentation Defines canonical keys, exact sample ordering and last-use legacy cache release.
   */
  export type Edge = {
    /** Declared authority identity prefixed by authority:, or the canonical legacy four-control-id tuple spelling. */
    key: string;
    /** Four canonical coefficient registry addresses for this edge; equal coordinates alone never merge identities. */
    ids: number[];
    /** Incident patch sides in input patch order, sharing this physical boundary identity. */
    incidents: IAutoMovieBicubicAtlas64.Occurrence[];
    /** Union of all incidents' requested exact dyadic phase identities, keyed by canonical phase key. */
    phases: Map<string, IAutoMovieCanonicalBoundaryPhase64>;
    /** Registered phases sorted by exact value; distinct exact keys survive coincident rounded numeric views. */
    samples: IAutoMovieCanonicalBoundaryPhase64[];
    /** Count of adjacent sorted samples with equal binary64 views and distinct retained exact identities. */
    roundedCollisions: number;
    /** Legacy normalized canonical edge coordinate to emitted global vertex receipt, reused until the last incident patch. */
    vertices: Map<number, IAutoMovieBicubicAtlas64.Vertex>;
    /** First retained incident patch side, which supplies legacy position and normal ownership. */
    owner: IAutoMovieBicubicAtlas64.Occurrence;
    /** Last incident input patch ordinal; its completion permits releasing legacy edge vertex storage. */
    last: number;
  };

  /**
   * Shared control-identity corner retained until its last incident patch emits.
   * The millimetre position may alias the prepared root grid; emitted receipts are cached lazily.
   *
   * @evidence contracts/development/design.md#principled-representation First-owner unit-corner coordinates select analytic normals while the shared coefficient supplies model-millimetre position.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The atlas registry and vertex owner use one corner record for deterministic ownership and last-use release.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Control equivalence declares corner sharing; equal coordinates alone create no corner relation.
   * @evidence contracts/development/common.md#meaningful-documentation States grid aliasing, first-owner choice, optional receipt and release boundary.
   */
  export type Corner = {
    /** First retained incident patch and its exact unit-corner coordinates, fixed during registry construction. */
    owner: {
    /** Zero-based input patch ordinal chosen as this corner's deterministic owner. */
    patch: number;
    /** Owning patch corner's normalized u coordinate, either 0 or 1. */
    u: number;
    /** Owning patch corner's normalized v coordinate, either 0 or 1. */
    v: number };
    /** Admitted shared corner coefficient in millimetres, before render-position conversion to metres. */
    position: AutoMovieVector3Tuple;
    /** Last incident input patch ordinal; the registry releases this corner after that patch emits. */
    last: number;
    /** Cached generated render vertex in metres; absent until the first incident emits it. */
    vertex?: IAutoMovieBicubicAtlas64.Vertex;
  };
}

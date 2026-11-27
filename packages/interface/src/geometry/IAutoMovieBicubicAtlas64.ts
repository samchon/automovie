import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";
import type { AutoMovieBernsteinGrid64 } from "./AutoMovieBernsteinGrid64";
import type { IAutoMovieCanonicalBoundaryPhase64 } from "./IAutoMovieCanonicalBoundaryPhase64";
import type { IAutoMoviePrepareBicubicAtlasBoundary64 } from "./IAutoMoviePrepareBicubicAtlasBoundary64";

/**
 * Atlas chart, adaptive-cell and shared-boundary records used by planning and
 * emission.
 */
export namespace IAutoMovieBicubicAtlas64 {
  /** One tensor bicubic chart addressed in an immutable coefficient registry. */
  export type Patch = {
    /** Unique patch address in this atlas. */
    id: string;
    /** Sixteen coefficient registry addresses, v rows then u columns. */
    controlIds: readonly number[];
  };

  /**
   * Actual per-chunk emission counts, freshly allocated with each vertex
   * suffix.
   */
  export type Counts = {
    /**
     * Retained cells whose first face range begins in this chunk; continuation
     * ranges in later chunks do not count that cell again.
     */
    cells: number;
    /**
     * First-counted cells in this chunk whose estimate exceeds toleranceMm
     * under retain-coarse policy; continued ranges do not count them again.
     */
    retainedCoarseCells: number;
    /**
     * Number of newly appended render vertices in this chunk, excluding
     * references to earlier chunks.
     */
    vertices: number;
    /** Number of retained positive-area triangles emitted into this chunk. */
    triangles: number;
    /**
     * Proposed triangles with exactly zero metre-space area. Nonfinite area
     * instead stops patch emission and adds an arithmetic-unprocessed
     * diagnostic.
     */
    omittedZeroAreaTriangles: number;
    /**
     * New vertices whose analytic normal could not be normalized; their
     * published normal remains zero.
     */
    unresolvedVertexNormals: number;
    /**
     * Largest represented cell's binary64 Taylor error estimate in millimetres;
     * zero for an empty accumulator, not an outward-rounded certificate.
     */
    maxErrorBoundMm: number;
  };

  /**
   * One leaf's chunk-local accepted triangle interval, including collapsed
   * candidates.
   */
  export type Range = {
    /**
     * Input patch id owning this emitted range; distinct ids retain distinct
     * chart ownership.
     */
    patch: string;
    /** Lower normalized u coordinate of the owning retained cell in [0,1]. */
    u0: number;
    /** Upper normalized u coordinate of the owning retained cell in [0,1]. */
    u1: number;
    /** Lower normalized v coordinate of the owning retained cell in [0,1]. */
    v0: number;
    /** Upper normalized v coordinate of the owning retained cell in [0,1]. */
    v1: number;
    /**
     * The owning cell's actual Taylor error estimate in millimetres, including
     * an over-tolerance retained coarse cell.
     */
    approximationBoundMm: number;
    /**
     * First triangle ordinal within this chunk's index buffer, not a global
     * triangle index.
     */
    triangleStart: number;
    /** Number of consecutive retained triangles represented by this range. */
    triangleCount: number;
    /**
     * Proposed faces with exactly zero metre-space area while emitting this
     * range; nonfinite arithmetic terminates emission instead.
     */
    omittedZeroAreaTriangles: number;
  };

  /**
   * Adaptive leaf of a bicubic chart, retained after finite derivative-bound
   * evaluation.
   */
  export type Cell = {
    /**
     * Lower normalized u bound of this adaptive leaf in the original patch
     * domain.
     */
    u0: number;
    /**
     * Upper normalized u bound of this adaptive leaf in the original patch
     * domain.
     */
    u1: number;
    /**
     * Lower normalized v bound of this adaptive leaf in the original patch
     * domain.
     */
    v0: number;
    /**
     * Upper normalized v bound of this adaptive leaf in the original patch
     * domain.
     */
    v1: number;
    /**
     * Restricted 4-by-4 tensor Bernstein coefficients in millimetres, indexed
     * by v row then u column.
     */
    grid: AutoMovieBernsteinGrid64;
    /**
     * Binary64 same-parameter Taylor estimate Muu/8 + Muv/4 + Mvv/8 in
     * millimetres; not an outward-rounded proof.
     */
    error: number;
  };

  /**
   * Prepared root grid and retained leaves for one input patch. Grid storage
   * can be shared by an unsplit leaf or canonical positions; treat it as
   * immutable during emission.
   */
  export type Plan = {
    /**
     * Prepared 4-by-4 coefficient grid in millimetres. It is retained even for
     * an omitted patch; a coefficient-conflict plan keeps the initial
     * constructed grid before side overwrite.
     */
    grid: AutoMovieBernsteinGrid64;
    /**
     * Retained adaptive leaves only; a split parent does not coexist with its
     * retained children.
     */
    cells: IAutoMovieBicubicAtlas64.Cell[];
    /**
     * Patch-local admission, budget and approximation limitations retained for
     * terminal reporting.
     */
    diagnostics: string[];
  };

  /**
   * Admitted or transported side binding owned by canonical boundary
   * preparation.
   */
  export type Binding =
    IAutoMoviePrepareBicubicAtlasBoundary64.IResult["bindings"] extends Map<
      string,
      infer Value
    >
      ? Value
      : never;

  /**
   * One retained patch-side use in the shared edge registry; mutable requests
   * remain owned by that tessellation invocation and preserve authored local
   * coordinates.
   */
  export type Occurrence = {
    /** Zero-based input patch ordinal, also the deterministic emission order. */
    patch: number;
    /** Patch side ordinal: 0 bottom v=0, 1 right u=1, 2 top v=1, 3 left u=0. */
    side: number;
    /**
     * Whether the legacy control-id edge order reverses this side's increasing
     * local coordinate.
     */
    reverse: boolean;
    /**
     * Exact canonical phase key to this incident side's original normalized
     * local coordinate; mutable registry owned by the tessellation invocation.
     */
    requests: Map<string, number>;
    /**
     * Optional declared authority interval and normal fan; absence selects
     * legacy four-control-id identity.
     */
    binding?: IAutoMovieBicubicAtlas64.Binding;
  };

  /**
   * Cached receipt for an already appended render vertex. Reused receipts may
   * be referenced from later chunks; consumers must preserve the published
   * global index.
   */
  export type Vertex = {
    /**
     * Append-only global render vertex index, including the caller's
     * vertexOffset.
     */
    index: number;
    /**
     * Generated Cartesian position in model metres, retained for shared
     * incidence reuse; no world transform has been applied.
     */
    position: AutoMovieVector3Tuple;
  };

  /**
   * Parameter-boundary vertex request, optionally carrying an exact shared
   * phase.
   */
  export type Sample = {
    /** Normalized coordinate in this patch's u direction, in [0,1]. */
    u: number;
    /** Normalized coordinate in this patch's v direction, in [0,1]. */
    v: number;
    /**
     * Exact boundary phase when explicitly attached by the emitter; absence
     * permits lookup from the side's phase map, including at patch corners.
     */
    phase?: IAutoMovieCanonicalBoundaryPhase64;
    /**
     * Explicit incident side ordinal 0 through 3; when absent the vertex owner
     * infers touching sides and prefers an explicitly bound one.
     */
    side?: number;
  };

  /**
   * Per-invocation shared boundary registry with exact requested phases and a
   * legacy render-vertex cache. Canonically bound normal fans use a separate
   * vertex map.
   */
  export type Edge = {
    /**
     * Declared authority identity prefixed by authority:, or the canonical
     * legacy four-control-id tuple spelling.
     */
    key: string;
    /**
     * Four canonical coefficient registry addresses for this edge; equal
     * coordinates alone never merge identities.
     */
    ids: number[];
    /**
     * Incident patch sides in input patch order, sharing this physical boundary
     * identity.
     */
    incidents: IAutoMovieBicubicAtlas64.Occurrence[];
    /**
     * Union of all incidents' requested exact dyadic phase identities, keyed by
     * canonical phase key.
     */
    phases: Map<string, IAutoMovieCanonicalBoundaryPhase64>;
    /**
     * Registered phases sorted by exact value; distinct exact keys survive
     * coincident rounded numeric views.
     */
    samples: IAutoMovieCanonicalBoundaryPhase64[];
    /**
     * Count of adjacent sorted samples with equal binary64 views and distinct
     * retained exact identities.
     */
    roundedCollisions: number;
    /**
     * Legacy normalized canonical edge coordinate to emitted global vertex
     * receipt, reused until the last incident patch.
     */
    vertices: Map<number, IAutoMovieBicubicAtlas64.Vertex>;
    /**
     * First retained incident patch side, which supplies legacy position and
     * normal ownership.
     */
    owner: IAutoMovieBicubicAtlas64.Occurrence;
    /**
     * Last incident input patch ordinal; its completion permits releasing
     * legacy edge vertex storage.
     */
    last: number;
  };

  /**
   * Shared control-identity corner retained until its last incident patch
   * emits. The millimetre position may alias the prepared root grid; emitted
   * receipts are cached lazily.
   */
  export type Corner = {
    /**
     * First retained incident patch and its exact unit-corner coordinates,
     * fixed during registry construction.
     */
    owner: {
      /**
       * Zero-based input patch ordinal chosen as this corner's deterministic
       * owner.
       */
      patch: number;
      /** Owning patch corner's normalized u coordinate, either 0 or 1. */
      u: number;
      /** Owning patch corner's normalized v coordinate, either 0 or 1. */
      v: number;
    };
    /**
     * Admitted shared corner coefficient in millimetres, before render-position
     * conversion to metres.
     */
    position: AutoMovieVector3Tuple;
    /**
     * Last incident input patch ordinal; the registry releases this corner
     * after that patch emits.
     */
    last: number;
    /**
     * Cached generated render vertex in metres; absent until the first incident
     * emits it.
     */
    vertex?: IAutoMovieBicubicAtlas64.Vertex;
  };
}

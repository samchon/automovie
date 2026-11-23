import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";
import type { IAutoMovieBicubicAtlas64 } from "./IAutoMovieBicubicAtlas64";

/**
 * Immutable atlas input, streamed vertex suffixes and terminal tessellation
 * totals.
 */
export namespace IAutoMovieBicubicAtlasTessellation64 {
  /**
   * Immutable millimetre coefficient registry, bicubic charts and finite-work
   * policy. Keep the complete input unchanged until generator completion or
   * cancellation; canonical position closures read borrowed controls during
   * emission. Admission in AutoMovieBicubicAtlasPlan64 and boundary preparation
   * throws before yielding.
   */
  export type Input = {
    /**
     * Nonblank identity scope for this physical atlas instance, prefixed onto
     * logical vertex IDs; distinct physical instances require distinct
     * domains.
     */
    topologyDomain: string;
    /** Complete immutable coefficient registry, millimetres. */
    controlsMm: readonly Readonly<AutoMovieVector3Tuple>[];
    /** Complete bicubic charts and their explicit shared coefficient identities. */
    patches: readonly IAutoMovieBicubicAtlas64.Patch[];
    /**
     * Canonical cubic owners; omitted or empty declares none. Bindings
     * construct patch edges from oriented restrictions of these controls.
     */
    boundaryAuthorities?: readonly {
      /**
       * Unique nonblank authority name within this input; coordinate equality
       * does not equate different names.
       */
      id: string;

      /**
       * Four safe nonnegative registry indices in cubic Bernstein order,
       * defining the authority from normalized phase zero to one.
       */
      controlIds: readonly [number, number, number, number];
    }[];
    /**
     * Explicit side restrictions and independent render-normal fans. Omitted or
     * empty uses legacy complete-edge ID matching; matching unbound four-ID
     * sides inherit a declared restriction with a separate legacy fan.
     */
    boundaryBindings?: readonly {
      /**
       * Existing input patch ID; at most one explicit binding may address each
       * patch/side pair.
       */
      patch: string;

      /**
       * Side using increasing local coordinate: 0 bottom v=0, 1 right u=1, 2
       * top v=1, 3 left u=0. Top/left are not reversed merely for boundary
       * walk.
       */
      side: 0 | 1 | 2 | 3;

      /**
       * Existing boundaryAuthorities ID whose cubic controls own this side
       * restriction.
       */
      authority: string;

      /**
       * Finite canonical phase in [0,1] at local side coordinate zero. Must
       * differ from end.
       */
      start: number;

      /**
       * Finite canonical phase in [0,1] at local side coordinate one; less than
       * start reverses the authority restriction.
       */
      end: number;

      /**
       * Nonblank render-normal sharing identity at a physical boundary point.
       * Equal fan IDs reuse the first emitted normal/index; different fans
       * retain distinct indices at the same physical position.
       */
      normalFan: string;
    }[];
    /**
     * Positive finite analytic-field to piecewise-linear Taylor estimate
     * request in millimetres; not an outward-rounded distance or
     * source-fidelity certificate.
     */
    toleranceMm: number;
    /**
     * Positive safe integer budget across all patches. Initial roots reserve
     * slots in input order; each binary split adds one slot, and omissions do
     * not free a slot for later work.
     */
    maxCells: number;
    /**
     * Finite leaf retention at the same slot budget; omitted selects strict
     * omission.
     */
    cellBudgetPolicy?: "retain-coarse" | "omit-unresolved";
    /**
     * Safe integer maximum newly published vertices per chunk, at least three.
     * Previously published vertex references do not consume this suffix
     * capacity.
     */
    maxVerticesPerChunk: number;
    /**
     * Nonnegative safe integer first global index of this run; omitted means
     * zero. Later index exhaustion is an explicit resource omission.
     */
    vertexOffset?: number;

    /**
     * Retain six patch-local numbers per accepted triangle, in index-corner
     * order; omitted allocates none.
     */
    retainTriangleParameters?: boolean;
    /**
     * Retain prepared millimetre root-grid copies, including initial
     * constructed grids for plans stopped by coefficient conflicts; omitted or
     * false allocates no snapshots.
     */
    retainPatchCoefficients?: boolean;
  };

  /**
   * One yielded patch-local vertex suffix and its global triangle references.
   * Buffers belong to the consumer and are not subsequently appended by the
   * generator. A chunk may be empty or partially emitted and carry
   * diagnostics.
   */
  export type Chunk = {
    /** Owning patch name for this streamed suffix. */
    patch: string;
    /** First global index of newly published vertices. */
    vertexStart: number;
    /**
     * Flat xyz triples for newly appended vertices in model metres, with no
     * world transform applied.
     */
    positions: number[];
    /**
     * Flat xyz unit normals aligned with positions, from increasing-u cross
     * increasing-v analytic partials; unresolved normals are zero. Shared
     * legacy/fan vertices retain their first owner's normal.
     */
    normals: number[];
    /**
     * One logical position identity per new vertex, scoped by topologyDomain.
     * Different normal fans may repeat the same physical identity.
     */
    physicalVertexIds: string[];
    /** Global triangle indices, including previously published vertices. */
    indices: number[];

    /**
     * Requested actual [u0,v0,u1,v1,u2,v2] for each emitted triangle; not per
     * shared vertex and not a packed texture chart.
     */
    triangleParameters?: number[];
    /**
     * Copied prepared 4-by-4 millimetre root grid when requested, including on
     * omitted/conflicting plans; it is not evidence that the patch emitted
     * completely. Absent unless retention was requested.
     */
    patchCoefficients?: Readonly<AutoMovieVector3Tuple>[][];
    /** Patch-local parameter attribution with chunk-relative triangle offsets. */
    faceRanges: IAutoMovieBicubicAtlas64.Range[];
    /** Actual retained cell and output arithmetic counts. */
    counts: IAutoMovieBicubicAtlas64.Counts;
    /**
     * Incomplete work and qualification messages, independent of finite
     * display.
     */
    diagnostics: string[];
  };

  /**
   * Terminal return after generator exhaustion; cancelling after a finite
   * prefix does not deliver this summary. Omitted patches include partial
   * failures.
   */
  export type Summary = {
    /**
     * Requested copied prepared grids in input patch order, independent of
     * emission completeness. Conflicting plans also retain their initial
     * constructed grid; snapshots are not an admission or conformity
     * certificate.
     */
    patchCoefficients?: {
      /**
       * Input patch ID associated with this prepared coefficient snapshot,
       * including when that patch has no retained cells.
       */
      patch: string;
      /**
       * Copied prepared 4-by-4 tensor Bernstein grid in millimetres, indexed v
       * row then u column. Includes grids of plans omitted for coefficient
       * conflicts or resource limits.
       */
      gridMm: Readonly<AutoMovieVector3Tuple>[][];
    }[];
    /** Total admitted analytic patches in this run. */
    patches: number;
    /** Patches with at least one unprocessed region. */
    omittedPatches: number;
    /**
     * True when no planned retained cell exceeds toleranceMm, even if cells or
     * whole patches were omitted. It does not include a completeness or
     * outward-rounding guarantee.
     */
    approximationQualified: boolean;
    /**
     * Planned finite leaves retained above toleranceMm, including leaves whose
     * later emission may fail.
     */
    retainedCoarseCells: number;
    /** Actual published render vertex count. */
    vertices: number;
    /** Actual retained triangle count. */
    triangles: number;
    /**
     * Run-level planning, boundary-relation and emission-failure messages.
     * Per-chunk normal, zero-area and incidence qualification messages are not
     * all copied here.
     */
    diagnostics: string[];
  };
}

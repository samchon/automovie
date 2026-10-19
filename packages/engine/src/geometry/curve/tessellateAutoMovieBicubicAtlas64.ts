import { AutoMovieBicubicAtlasEmit64 } from "./AutoMovieBicubicAtlasEmit64";
import { AutoMovieBicubicAtlasPlan64 } from "./AutoMovieBicubicAtlasPlan64";
import { AutoMovieBicubicAtlasRegistry64 } from "./AutoMovieBicubicAtlasRegistry64";
import type { AutoMovieBicubicAtlasTypes64 } from "./AutoMovieBicubicAtlasTypes64";
import type { IAutoMovieCurve64 as C } from "./IAutoMovieCurve64";

type Patch = AutoMovieBicubicAtlasTypes64["Patch"];
type AtlasInput = AutoMovieBicubicAtlasTypes64["AtlasInput"];
type Counts = AutoMovieBicubicAtlasTypes64["Counts"];
type Range = AutoMovieBicubicAtlasTypes64["Range"];
type AtlasChunk = AutoMovieBicubicAtlasTypes64["AtlasChunk"];
type AtlasSummary = AutoMovieBicubicAtlasTypes64["AtlasSummary"];

const SIDES: readonly (readonly number[])[] = [
  [0, 1, 2, 3],
  [3, 7, 11, 15],
  [12, 13, 14, 15],
  [0, 4, 8, 12],
];
const CORNERS: readonly (readonly [number, number, number])[] = [
  [0, 0, 0],
  [3, 1, 0],
  [15, 1, 1],
  [12, 0, 1],
];

/**
 * Tessellate complete bicubic patches with explicit shared control identities.
 * Sixteen controls are row-major: v rows, u columns, all in millimetres.
 * Matching four-ID boundary tuples, including reversals, own one edge; matching
 * endpoint control IDs own one corner. Different IDs at equal positions stay separate.
 * Output positions are metres, indices are append-only global indices from vertexOffset,
 * and a chunk may reference earlier vertices. Inputs remain immutable until completion.
 * Optional triangle-corner parameters retain each accepted triangle's actual
 * chart coordinates independently of shared render vertices and normal fans.
 * They follow emitted triangle order, including after local omissions.
 *
 * Exact Bernstein restrictions refine each unit cell using the same-parameter Taylor
 * estimate Muu/8+Muv/4+Mvv/8. Second-partial coefficient norms bound these derivatives
 * in exact arithmetic; binary64 estimates are not outward-rounded certificates.
 * Every incident patch registers boundary requests before emission. Line registries
 * add hanging corners to parameter-boundary triangulations without a global grid.
 * Bottom/top chains are zipped before exterior hanging edges are split, using
 * their existing samples rather than an analytic cell-center vertex. Matching
 * translated boundary polygons retain station-parallel face planes in exact
 * arithmetic. Unequal samples and general fields acquire no normal-error bound.
 * Source fidelity, immersion, orientability and absence of intersections are unproved.
 *
 * maxCells bounds allocated leaf slots across the atlas. A cell needing refinement
 * after the budget is exhausted follows cellBudgetPolicy: the strict default leaves
 * an explicit gap, while retain-coarse emits that existing finite leaf once with
 * its actual error estimate and approximationQualified=false. A split parent is
 * never retained with its children. All retained leaves enter the same edge-request
 * union, so coarse budget retention does not bypass boundary conformity.
 * Legacy four-ID edges share the first retained incident patch's normal. Explicit
 * canonical bindings instead construct the edge coefficients before bounds, union
 * exact dyadic phase requests and alias hanging corners by declared endpoints.
 * Distinct exact phases retain separate identities even when their binary64 views
 * coincide; zero-area triangles remain counted omissions. An inverse that
 * cannot represent an interior coordinate omits that request with a local diagnostic,
 * preserving other requests and patches without welding or altering coefficients.
 * Position owners are independent of render normal fans, preserving both crease
 * banks' analytic normals without averaging. This establishes no G1 certificate.
 * Canonical endpoint values must agree exactly across declared corner aliases.
 * Conflicting classes omit only their incident patches with explicit diagnostics.
 * Consistent bindings construct the shared corner in every incident chart before
 * derivative bounds, including charts that retain an unbound side at that corner.
 * Complete legacy edge tuples consume that same constructed edge, including reversal.
 * Equivalent nets under different authoritative intervals retain finite geometry
 * with an explicit inter-authority polygon-conformity limitation.
 * Exact zero or nonfinite normals
 * remain zero with counts; finite positive-area geometry survives normal qualifications.
 *
 * @evidence contracts/common.md#principled-implementation Complete tensor Bernstein evaluation, exact subdivision, Taylor derivative bounds and declared edge authority generate a new indexed mesh. Sample unions conform within one authoritative interval family; different equivalent authority families retain a separate explicit polygon-conformity limitation.
 * @evidence contracts/common.md#clear-and-simple-design Admission, bounded atlas planning, canonical edge registration and shared parameter-boundary triangulation expose separate ownership stages.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source mesh, coordinate welding, anatomy table, dropped control, arbitrary tolerance change or fallback normal supplies geometry.
 * @evidence contracts/common.md#meaningful-documentation States control ordering, units, shared identity, streaming lifetime, approximation scope and local failure effects.
 * @evidence contracts/performance.md#efficient-algorithms Admission is O(C+P). At most maxCells leaf slots and fewer than twice as many refinement nodes are allocated. Registries sort O(L) corners in O(L log L); each cell triangulates its N ordered perimeter samples in O(N) work, followed by fixed-degree evaluations and logarithmic range searches.
 * @evidence contracts/performance.md#reuse-equivalent-work Canonical positions are cached after independent coefficient-consistency checks; distinct normal fans retain separate analytic render vertices at that identity. Atomic interval incidence is computed once per edge. Exact child nets serve refinement without source refitting.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The generator retains O(C+P+L) coefficient references, plans, canonical samples and fan registries plus one vertex-bounded chunk. Requested corner parameters add six numbers per emitted triangle alongside that chunk's indices; omitted requests allocate no parameter buffer. Legacy edge/corner caches release after their last incident patch; canonical registries release at completion or cancellation. Consumers own yielded arrays.
 */
export function* tessellateAutoMovieBicubicAtlas64(
  input: AtlasInput,
): Generator<AtlasChunk, AtlasSummary, void> {
  if (input.retainTriangleParameters !== undefined &&
      typeof input.retainTriangleParameters !== "boolean")
    throw new Error("Triangle parameter retention must be boolean");
  const prepared: ReturnType<typeof AutoMovieBicubicAtlasPlan64> =
    AutoMovieBicubicAtlasPlan64(input, SIDES, CORNERS);
  const registered: ReturnType<typeof AutoMovieBicubicAtlasRegistry64> =
    AutoMovieBicubicAtlasRegistry64(input, prepared, SIDES, CORNERS);
  return yield* AutoMovieBicubicAtlasEmit64(
    input,
    prepared,
    registered,
    SIDES,
    CORNERS,
  );
}

/**
 * Immutable input, streamed chunk and terminal summary contracts for this generator.
 *
 * @evidence contracts/common.md#principled-implementation Explicit coefficient identity, millimetre inputs and metre output define the same public streaming contract as the generator.
 * @evidence contracts/common.md#clear-and-simple-design Input policy, transferred geometry and terminal scalar accounting have separate record owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Types introduce no source fallback, implicit welding or numerical default.
 * @evidence contracts/common.md#meaningful-documentation Members state units, append-only indexing, ownership and independent approximation qualification.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Erased records perform no numerical work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Erased records own no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Runtime acquisition and transferred chunk lifetime belong to the generator and its consumer.
 */
export namespace tessellateAutoMovieBicubicAtlas64 {
  /**
   * Immutable millimetre coefficient registry and row-major bicubic control IDs.
   *
   * Complete controls and shared integer IDs define the tensor atlas.
   * One input record owns the explicit approximation and resource policy.
   * No source mesh or anatomy-specific coefficient table is accepted.
   * The operator states row ordering, mm units, identity and immutable lifetime.
   * A type performs no computation.
   * A type coordinates no cache.
   * A type owns no runtime input lifetime.
   */
  export type Input = {
    /** Identity scope shared only by this declared physical atlas instance. */
    topologyDomain: string;
    /** Complete immutable coefficient registry, millimetres. */
    controlsMm: readonly C.Vector[];
    /** Complete bicubic charts and their explicit shared coefficient identities. */
    patches: readonly Patch[];
    /** Canonical cubic owners; bindings construct patch edges from their restrictions. */
    boundaryAuthorities?: readonly {
      id: string;
      controlIds: readonly [number, number, number, number];
    }[];
    /** Oriented canonical intervals and independent analytic normal-fan identities. */
    boundaryBindings?: readonly {
      patch: string;
      side: 0 | 1 | 2 | 3;
      authority: string;
      start: number;
      end: number;
      normalFan: string;
    }[];
    /** Requested analytic-field to PL approximation estimate, millimetres. */
    toleranceMm: number;
    /** Total allocated leaf slots, including explicitly unprocessed cells. */
    maxCells: number;
    /** Finite leaf retention at the same slot budget; omitted selects strict omission. */
    cellBudgetPolicy?: "retain-coarse" | "omit-unresolved";
    /** Maximum newly published vertices in one chunk, at least three. */
    maxVerticesPerChunk: number;
    /** First global index of this run; omitted means zero. */
    vertexOffset?: number;

    /** Retain six patch-local numbers per accepted triangle, in index-corner order; omitted allocates none. */
    retainTriangleParameters?: boolean;
  };
  /**
   * Metre vertex suffix, global indices, patch-local parameter face ranges and diagnostics.
   *
   * Generated indices name current or previously published vertices.
   * Geometry and its patch attribution transfer together.
   * Equal coordinates do not imply shared identity.
   * States metre units and append-only indexing.
   * The record performs no arithmetic.
   * Shared geometry reuse belongs to the generator.
   * Consumers own and release yielded buffers.
   */
  export type Chunk = {
    /** Owning patch name for this streamed suffix. */
    patch: string;
    /** First global index of newly published vertices. */
    vertexStart: number;
    /** New positions in model metres. */
    positions: number[];
    /** Own analytic render normals, aligned with positions. */
    normals: number[];
    /** Logical position identities, independent of normal fans. */
    physicalVertexIds: string[];
    /** Global triangle indices, including previously published vertices. */
    indices: number[];

    /** Requested actual [u0,v0,u1,v1,u2,v2] for each emitted triangle; not per shared vertex and not a packed texture chart. */
    triangleParameters?: number[];
    /** Patch-local parameter attribution with chunk-relative triangle offsets. */
    faceRanges: Range[];
    /** Actual retained cell and output arithmetic counts. */
    counts: Counts;
    /** Incomplete work and qualification messages, independent of finite display. */
    diagnostics: string[];
  };
  /**
   * Final published counts; omittedPatches includes partially unprocessed patches.
   *
   * Explicit omissions distinguish a finite prefix from a complete atlas.
   * Final scalar totals are separate from transferred geometry.
   * Completion is not an embedding or fidelity certificate.
   * States partial omission scope.
   * A type computes no totals.
   * A type owns no cache.
   * Only scalar totals and explicit limitations remain at completion.
   */
  export type Summary = {
    /** Total admitted analytic patches in this run. */
    patches: number;
    /** Patches with at least one unprocessed region. */
    omittedPatches: number;
    /** True only if every retained cell meets the requested analytic approximation estimate. */
    approximationQualified: boolean;
    /** Finite leaves explicitly retained above the approximation request. */
    retainedCoarseCells: number;
    /** Actual published render vertex count. */
    vertices: number;
    /** Actual retained triangle count. */
    triangles: number;
    /** Final unresolved work and arithmetic messages. */
    diagnostics: string[];
  };
}

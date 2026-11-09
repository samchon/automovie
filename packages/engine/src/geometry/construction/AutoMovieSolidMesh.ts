import { AutoMovieSolidMeshTessellate } from "./AutoMovieSolidMeshTessellate";
import { AutoMovieSolidMeshWrite } from "./AutoMovieSolidMeshWrite";
import type { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";
import { faceAutoMovieSolidMesh } from "./faceAutoMovieSolidMesh";

/** World-space millimetre vector. */
type Vec3 = AutoMovieSolidVector.Vec3;

/**
 * Indexed source surfaces with authoritative shared boundary identities.
 *
 * @evidence contracts/common.md#principled-implementation Retains untouched full cells and triangulates the remaining native constrained region; original rail IDs and explicit open occurrences preserve shared geometry.
 * @evidence contracts/common.md#clear-and-simple-design Public mesh data delegates face preparation/commit, final writes and seam/closure tessellation to their responsibility owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not weld points or zip unrelated residual boundaries. Named unsupported topology is reported; an absent failure callback throws before face writes.
 * @evidence contracts/common.md#meaningful-documentation States owner-local chart/world-mm data, source coherence, explicit endpoint records and partial-skin failure scope.
 * @evidence contracts/performance.md#efficient-algorithms Includes grid classification, constraint subdivision, component bridging, cubic ear search, point insertion and Lawson legalization; every membership query's source cost and total provenance length remain part of that work.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares station-major source readings and original boundary IDs within one face; a new face invocation owns new preparation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Mesh numbers and owner closures survive with the caller; face scratch/provenance expires, and no global source registry/cache is added.
 */
export namespace AutoMovieSolidMesh {
  /**
   * One evaluating surface, registered by its unique source name.
   *
   * @evidence contracts/common.md#principled-implementation The stored name and point callback replay an owner/u/v triple on its original surface.
   * @evidence contracts/common.md#clear-and-simple-design A fixed record identifies one owner in the mesh table.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Same-named unchanged surfaces are a caller identity premise, not a tested equivalence or positional weld.
   * @evidence contracts/common.md#meaningful-documentation Documents unique name and callback meaning.
   * @evidence contracts/performance.md#efficient-algorithms The record performs no geometric work; registration separately scans owner names.
   * @evidence contracts/performance.md#reuse-equivalent-work Vertices of that named source share its existing owner index.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The mesh retains the callback and transitively its surface until released.
   */
  export interface IOwner {
    /** The surface's name. */
    name: string;

    /**
     * Read a point in the owner's native chart, returning world millimetres.
     *
     * @evidence contracts/common.md#principled-implementation Registration reads the original surface's optional Point0 at the supplied u/v, otherwise its existing jet point; an actual pole value does not require physical2.
     * @evidence contracts/common.md#clear-and-simple-design Stored chart parameters are used directly without a reconstructed projection.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Valid source domain and callback ownership remain the producer's contract; thrown effects propagate.
     * @evidence contracts/common.md#meaningful-documentation Distinguishes owner chart parameters from world-mm result.
     * @evidence contracts/performance.md#efficient-algorithms One original Point0 evaluation, or one jet evaluation when Point0 is absent, supplies the point.
     * @evidence contracts/performance.md#reuse-equivalent-work No replay cache assumes a mutable source stayed unchanged.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The source owns its returned vector policy; the containing owner retains its callback.
     */
    point(a: number, b: number): Vec3;
  }

  /**
   * Parallel indexed geometry buffers and their evaluating owners.
   *
   * @evidence contracts/common.md#principled-implementation Position/chart triples and shared triangle indices retain exact vertex identity.
   * @evidence contracts/common.md#clear-and-simple-design One plain record holds emitted geometry and source replay.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Ordinary arrays are required; hostile proxies and allocation failure are outside face transaction recovery.
   * @evidence contracts/common.md#meaningful-documentation Names world-mm positions, outward indices and owner/u/v coordinates.
   * @evidence contracts/performance.md#efficient-algorithms Storage performs no evaluation; population is O(V+T+R).
   * @evidence contracts/performance.md#reuse-equivalent-work Adjacent source faces reference the same original boundary indices.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns arrays and R source-retaining owner closures until releasing the mesh.
   */
  export interface IMesh {
    /** Flat `[x, y, z, ...]` positions, mm. */
    positions: number[];

    /** Flat triangle indices, outward. */
    indices: number[];

    /** Flat `[owner, a, b]` per vertex. */
    coordinates: number[];

    /** Owners by index. */
    owners: IOwner[];
  }

  /**
   * An authoritative shared trim boundary, expressed on this face.
   *
   * @evidence contracts/common.md#principled-implementation Kind selects the retained side and the occurrence chart describes this face independently of the global mesh owner.
   * @evidence contracts/common.md#clear-and-simple-design Parallel ID/chart arrays make source identity and native cover explicit.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Coincident distinct IDs are not welded. A repeated ID needs exactly equal station and phase equal to its first authority plus an integer period in binary64; inexact translations are an encoding refusal, not proof of invalid anatomy. Local periodic primitives retain the kept-side reader's family.
   * @evidence contracts/common.md#meaningful-documentation Documents hole/island/start/end and unwrapped native chart order.
   * @evidence contracts/performance.md#efficient-algorithms Input storage performs no classification; consumers pay their segment scans.
   * @evidence contracts/performance.md#reuse-equivalent-work Grid, constraints and source membership consume the same coherent original boundary.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Borrowed numeric arrays must remain coherent through the synchronous face call and are not cached globally.
   */
  export interface ILoop {
    /** Which side the face keeps. */
    kind: "hole" | "island" | "start" | "end";

    /** Vertex indices, in loop order. */
    vertices: number[];

    /** Each vertex's chart point `[u, v]` on the face, `v` unwrapped along the loop. */
    chart: [number, number][];
  }

  /**
   * A published source rail before indexed seam insertion.
   *
   * @evidence contracts/common.md#principled-implementation Carries rail chart columns, retained side and optional atlas source-face IDs.
   * @evidence contracts/common.md#clear-and-simple-design Separates pre-vertex source data from the indexed ILoop.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not prove rail correspondence or fit a new curve.
   * @evidence contracts/common.md#meaningful-documentation Names column order, native chart and absent atlas-face meaning.
   * @evidence contracts/performance.md#efficient-algorithms This input record performs no numerical work.
   * @evidence contracts/performance.md#reuse-equivalent-work Seam insertion reads the original published rail columns.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns numeric arrays; indexed seam results currently share the original chart arrays.
   */
  export interface ILoopChart {
    /** Which side the face keeps, as {@link ILoop.kind}. */
    kind: ILoop["kind"];

    /** Each point `[u, v]` on the face, `v` unwrapped along the loop, in loop order. */
    chart: [number, number][];

    /** Each point's face on an atlas host (`AutoMovieSolidRail.IRail.hostFace`); absent, every point on the one face. */
    faces?: number[];
  }

  /**
   * One coherent source face and its finite ordered sampling domain.
   *
   * @evidence contracts/common.md#principled-implementation The source, original trim IDs and finite grid define a constrained region; the declared source sign turns its native chart outward.
   * @evidence contracts/common.md#clear-and-simple-design Optional onFailure is the named-planning recovery seam, separate from ordinary source exceptions.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Absence or explicit undefined throws on named refusal before mesh append. Recording a refusal can leave other faces/seams present, which is a partial result rather than a valid complete skin.
   * @evidence contracts/common.md#meaningful-documentation Documents grid/domain, source coherence, inversion and named/partial endpoint failure semantics.
   * @evidence contracts/performance.md#efficient-algorithms Work depends on grid/constraint populations and actual source/predicate costs; an empty retained grid does not prove empty skin.
   * @evidence contracts/performance.md#reuse-equivalent-work Source and loops stay coherent throughout face-local preparation and commit.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Inputs are borrowed synchronously; successful owner registration retains the source through the mesh.
   */
  export interface IFace {
    /** The surface. */
    surface: IAutoMovieSolidSurface;

    /** Grid stations (`u`), strictly increasing; the first and last are the face's open ends. */
    stations: number[];

    /** Grid phases (`v`), strictly increasing; one period's worth (without its repeat) on a periodic face. */
    phases: number[];

    /** Its actual cutting loops; their exposed edges never become source-end caps. */
    loops: ILoop[];

    /** Optional authoritative vertices on exact original grid sides, preserving shared IDs without cutting the source. Nonperiodic rectangle perimeters use island; periodic sides use their actual start/end role. */
    domainLoops?: ILoop[];

    /**
     * Whether the face is a diff's cutter, whose kept wall faces into the
     * cutter: the solid's outside there is the cutter's inside. Absent, false.
     */
    inverted?: boolean;

    /**
     * Receive a named planning refusal or partial endpoint diagnostic.
     *
     * @evidence contracts/common.md#principled-implementation The face owner reports failed indexed-partition premises before append; partial periodic endpoint arcs are reported and excluded from cap/event output.
     * @evidence contracts/common.md#clear-and-simple-design An optional synchronous callback is the explicit recovery seam; absence or undefined preserves the throwing default.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not receive or swallow arbitrary source, keeps or callback exceptions; those propagate with their original object. Recording a refusal leaves a partial figure rather than certifying a complete skin.
     * @evidence contracts/common.md#meaningful-documentation States named versus thrown failure, partial output and callback-free default semantics.
     * @evidence contracts/performance.md#efficient-algorithms Callback cost belongs to its consumer and is paid only for a reported refusal/partial endpoint, not every triangle.
     * @evidence contracts/performance.md#reuse-equivalent-work Each face reports its own current failed premise; no callback effects are memoized or shared across faces.
     * @evidence contracts/performance.md#bound-retention-and-release-resources Borrowed only for the synchronous face call; it must not mutate or reenter the associated mesh. The planner and mesh do not retain it after return or throw.
     */
    onFailure?: (detail: string) => void;
  }

  /**
   * A drawn boundary carrying its actual face occurrences and closing turn.
   *
   * @evidence contracts/common.md#principled-implementation Original mesh IDs, native cover coordinates and integer winding come directly from the positive triangle boundary; end is assigned only to a complete constant-station periodic endpoint.
   * @evidence contracts/common.md#clear-and-simple-design Cap/event consumers read explicit occurrence data instead of a global-ID registry or the first matching foreign chart.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Partial periodic arcs are diagnosed rather than capped; a generic planar rim has end null and is not a pole endpoint.
   * @evidence contracts/common.md#meaningful-documentation States positive native traversal, per-occurrence chart, closing winding and endpoint meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This output record performs no computation.
   * @evidence contracts/performance.md#reuse-equivalent-work Preserves the actual indexed plan and cover without reconstructing phase from positions.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Caller-owned copied numeric arrays retain no source surface, callback or registry.
   */
  export interface IOpen {
    /** Original committed IDs in positive native boundary traversal. */ vertices: number[];
    /** Same-face [u,v] per occurrence, including accumulated phase lifts. */ chart: [
      number,
      number,
    ][];
    /** Integer closing turn relative to the first occurrence. */ winding: number;
    /** Complete periodic endpoint, otherwise null for a planar domain rim. */ end:
      | "bottom"
      | "top"
      | null;
  }

  /**
   * The two indexed source rails published by a seam.
   *
   * @evidence contracts/common.md#principled-implementation Each returned rail reuses exactly the seam's original mesh indices.
   * @evidence contracts/common.md#clear-and-simple-design Host and part are distinct explicit face charts.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A shared vertex identity does not equate two surfaces' chart coordinates.
   * @evidence contracts/common.md#meaningful-documentation Names rail ownership and index sharing.
   * @evidence contracts/performance.md#efficient-algorithms The record performs no further numerical work.
   * @evidence contracts/performance.md#reuse-equivalent-work Adjacent face drawing consumes these exact source boundaries.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returned index arrays and original borrowed chart arrays follow the published rails' lifetime.
   */
  export interface IJoined {
    /** The host's rail as a trim of the host's face. */
    host: ILoop;

    /** The part's rail as a trim of the part's face. */
    part: ILoop;
  }

  /**
   * Allocate an empty, detached mutable mesh.
   *
   * @evidence contracts/common.md#principled-implementation Creates empty position, index, chart and owner arrays.
   * @evidence contracts/common.md#clear-and-simple-design A plain four-array record is sufficient.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Allocates no hidden geometry or cache.
   * @evidence contracts/common.md#meaningful-documentation States detached output ownership.
   * @evidence contracts/performance.md#efficient-algorithms Constant work and initially empty storage.
   * @evidence contracts/performance.md#reuse-equivalent-work Each request creates a separate mesh.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns all four returned arrays.
   */
  export function create(): IMesh {
    return { positions: [], indices: [], coordinates: [], owners: [] };
  }

  /**
   * Register an unchanged surface by its unique name.
   *
   * @evidence contracts/common.md#principled-implementation Delegates the existing name lookup and retained jet-point closure to the write owner.
   * @evidence contracts/common.md#clear-and-simple-design The public façade preserves one registration API.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Same-name equivalence is a caller premise; no positional identity or source freezing is inferred.
   * @evidence contracts/common.md#meaningful-documentation Names registration identity and transitive source retention.
   * @evidence contracts/performance.md#efficient-algorithms Scans R existing owner names in O(R).
   * @evidence contracts/performance.md#reuse-equivalent-work Repeated registration of the same name reuses its index.
   * @evidence contracts/performance.md#bound-retention-and-release-resources A new closure persists in the mesh only when the name was absent.
   */
  export function owner(mesh: IMesh, surface: IAutoMovieSolidSurface): number {
    return AutoMovieSolidMeshWrite.owner(mesh, surface);
  }

  /**
   * A published blend between corresponding host and part rail columns.
   *
   * @evidence contracts/common.md#principled-implementation Original rail chart columns and analytic blend rows define its seam surface.
   * @evidence contracts/common.md#clear-and-simple-design One input names source surfaces, paired columns and row count.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Corresponding columns, positive rows and coherent source domains are caller premises; no rail fit is introduced.
   * @evidence contracts/common.md#meaningful-documentation Names blend station length in mm and paired phase-column semantics.
   * @evidence contracts/performance.md#efficient-algorithms This record performs no source evaluation.
   * @evidence contracts/performance.md#reuse-equivalent-work Seam drawing reads the existing published columns.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Inputs are borrowed during drawing; inserted owner closures subsequently retain their sources.
   */
  export interface ISeam {
    /** The host's surface. */
    host: IAutoMovieSolidSurface;

    /** The part's surface. */
    part: IAutoMovieSolidSurface;

    /** Actual blend surface: first coordinate crosses `[0,length]`, second follows its periodic clock. */
    blend: IAutoMovieSolidSurface;

    /** Actual increasing blend-clock column coordinates within one period; absent retains the legacy uniform 0..2pi columns. */
    phases?: readonly number[];

    /** Upper first-coordinate bound: mm for a legacy blend chain, 1 for a normalized known-port band. */
    length: number;

    /** Host rail column k at phases[k], or the legacy default `2pi*k/count`. */
    hostLoop: ILoopChart;

    /** The part's rail at the same columns. */
    partLoop: ILoopChart;

    /** Rows of the blend between its rails, at least 1. */
    rows: number;
  }

  /**
   * Insert one published seam and return its exact indexed rails.
   *
   * @evidence contracts/common.md#principled-implementation Preserves original source-column/row evaluation and shared rail identity; the tessellation owner admits the actual closed clock/orientation and restores this call's append-only changes on propagated failure.
   * @evidence contracts/common.md#clear-and-simple-design Tessellate owns seam construction; this façade preserves the public API.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no fitted correspondence, positional weld or per-triangle reversal.
   * @evidence contracts/common.md#meaningful-documentation States original clock columns, legacy default2pi, closed-band admission, authoritative blend orientation, shared indices and append-only failure rollback.
   * @evidence contracts/performance.md#efficient-algorithms O(CR) source evaluations and triangles for C columns and R row intervals, plus owner-name scans and constant-size rollback bookkeeping.
   * @evidence contracts/performance.md#reuse-equivalent-work Published rail charts set each boundary point once per seam.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Mesh numbers/owners and returned rail indices persist; grid/triangle scratch is local.
   */
  export function seam(mesh: IMesh, input: ISeam): IJoined {
    return AutoMovieSolidMeshTessellate.seam(mesh, input);
  }

  /**
   * Append an admitted constrained source face and return its native domain boundaries.
   *
   * @evidence contracts/common.md#principled-implementation Prepares grid, residual index plan and provenance before any append, then uses one declared chart orientation for the whole face.
   * @evidence contracts/common.md#clear-and-simple-design The face owner coordinates preparation, named diagnostics and one commit.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported topology is never silently omitted. Omitted onFailure throws; arbitrary source, keeps and callback exceptions propagate with the same object before writes.
   * @evidence contracts/common.md#meaningful-documentation Returns actual native occurrence/winding/end data and diagnoses partial periodic arcs instead of capping them.
   * @evidence contracts/performance.md#efficient-algorithms Includes grid, bridge/ear/insertion/legalization work and predicate cost; no f1 speed or world-approximation bound is inferred from positive chart area.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses copied source jets, split constraints and original shared IDs within the synchronous call.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Scratch/provenance expires after commit/refusal; mesh owners retain surfaces and returned cycles own copied numeric data.
   */
  export function face(mesh: IMesh, input: IFace): IOpen[] {
    return faceAutoMovieSolidMesh(mesh, input);
  }

  /**
   * Append a caller-authored [edge,next,apex] fan from a returned positive native boundary.
   *
   * @evidence contracts/common.md#principled-implementation The fan reverses the source boundary traversal before applying source orientation and cutter inversion.
   * @evidence contracts/common.md#clear-and-simple-design Endpoint/pole admission remains with callers; Tessellate owns index emission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not cap arbitrary trim arcs or query foreign owner coordinates for a face normal.
   * @evidence contracts/common.md#meaningful-documentation States fan traversal, known native orientation and inversion premises.
   * @evidence contracts/performance.md#efficient-algorithms Linear triangle emission with no analytic reevaluation.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses original boundary indices and the declared orientation sign.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only appended indices survive; the operation adds no retained callback.
   */
  export function close(
    mesh: IMesh,
    triangles: readonly [number, number, number][],
    surface: IAutoMovieSolidSurface,
    inverted: boolean,
  ): void {
    AutoMovieSolidMeshTessellate.close(mesh, triangles, surface, inverted);
  }

  /**
   * Return the existing arclength zipper to an explicit event ring.
   *
   * @evidence contracts/common.md#principled-implementation Uses original world-polyline alignment/arc zipper and one population outward reference.
   * @evidence contracts/common.md#clear-and-simple-design Returns indices for the caller's shared event buffers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Requires compatible complete cycles and preserves the positions-only Human view; it is not a general trimmed-region fill.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes event correspondence from constrained face tessellation.
   * @evidence contracts/performance.md#efficient-algorithms Linear alignment, arc, zipper and normal scans in the two cycle sizes.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses original ring/cycle IDs and the caller's outward reference.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Fresh output triples belong to the caller; scratch expires and no mesh buffer changes.
   */
  export function bridge(
    mesh: IMesh,
    ring: readonly number[],
    cycle: readonly number[],
    out: Readonly<Vec3>,
  ): [number, number, number][] {
    return AutoMovieSolidMeshTessellate.bridge(mesh, ring, cycle, out);
  }

  /**
   * Replay a vertex using its own stored evaluating owner.
   *
   * @evidence contracts/common.md#principled-implementation Reads the owner/u/v triple and invokes that owner's original point callback.
   * @evidence contracts/common.md#clear-and-simple-design One indexed replay preserves the existing API.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Requires valid index/owner data and never substitutes that chart for a foreign face occurrence.
   * @evidence contracts/common.md#meaningful-documentation States owner-local inputs and original callback-result ownership.
   * @evidence contracts/performance.md#efficient-algorithms Constant indexing plus the source callback's actual cost.
   * @evidence contracts/performance.md#reuse-equivalent-work No replay cache assumes mutable callbacks stayed unchanged.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The three-number slice is local; returned vector ownership follows the source.
   */
  export function evaluate(mesh: IMesh, index: number): Vec3 {
    const c: number[] = mesh.coordinates.slice(3 * index, 3 * index + 3);
    return mesh.owners[c[0]!]!.point(c[1]!, c[2]!);
  }

  /**
   * Append one admitted world-mm point and owner-chart triple.
   *
   * @evidence contracts/common.md#principled-implementation Copies three world components and owner/u/v into aligned buffers.
   * @evidence contracts/common.md#clear-and-simple-design The write owner returns the new global index.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Finiteness and chart meaning are caller admission premises; no normalization or positional welding is performed.
   * @evidence contracts/common.md#meaningful-documentation Names low-level append ownership and coordinate units.
   * @evidence contracts/performance.md#efficient-algorithms Constant amortized append work.
   * @evidence contracts/performance.md#reuse-equivalent-work Copies the provided evaluated point without a new surface reading.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Six numeric entries persist in mesh; the borrowed vector is not retained.
   */
  export function vertex(
    mesh: IMesh,
    point: Readonly<Vec3>,
    id: number,
    u: number,
    v: number,
  ): number {
    return AutoMovieSolidMeshWrite.vertex(mesh, point, id, u, v);
  }
}

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
 * @evidence contracts/development/common.md#meaningful-documentation States owner-local chart/world-mm data, source coherence, explicit endpoint records and partial-skin failure scope.
 * @evidence contracts/development/design.md#principled-representation Represents Indexed source surfaces with authoritative shared boundary identities: companion namespace of 16 members (`IOwner`, `IMesh`, `ILoop`, `ILoopChart`, `IFace`, `IOpen`, ...); units and frames named in its text: world, local, second. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieSolidMesh` in packages/engine/src/geometry/construction/AutoMovieSolidMesh.ts; its surface is the 16 members listed and the text shows 37 other files naming it, mostly packages/engine (20), test (15), packages/human (2), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieSolidMesh {
  /**
   * One evaluating surface, registered by its unique source name.
   *
   * @evidence contracts/development/design.md#principled-representation The stored name and point callback replay an owner/u/v triple on its original surface.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A fixed record identifies one owner in the mesh table.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Same-named unchanged surfaces are a caller identity premise, not a tested equivalence or positional weld.
   * @evidence contracts/development/common.md#meaningful-documentation Documents unique name and callback meaning.
   */
  export interface IOwner {
    /** The surface's name. */
    name: string;

    /**
     * Read a point in the owner's native chart, returning world millimetres.
     *
     * @evidence contracts/development/implementation.md#principled-implementation Registration reads the original surface's optional Point0 at the supplied u/v, otherwise its existing jet point; an actual pole value does not require physical2.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Stored chart parameters are used directly without a reconstructed projection.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Valid source domain and callback ownership remain the producer's contract; thrown effects propagate.
     * @evidence contracts/development/common.md#meaningful-documentation Distinguishes owner chart parameters from world-mm result.
     * @evidence contracts/development/implementation.md#efficient-algorithms One original Point0 evaluation, or one jet evaluation when Point0 is absent, supplies the point.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work No replay cache assumes a mutable source stayed unchanged.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The source owns its returned vector policy; the containing owner retains its callback.
     */
    point(a: number, b: number): Vec3;
  }

  /**
   * Parallel indexed geometry buffers and their evaluating owners.
   *
   * @evidence contracts/development/design.md#principled-representation Position/chart triples and shared triangle indices retain exact vertex identity.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One plain record holds emitted geometry and source replay.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Ordinary arrays are required; hostile proxies and allocation failure are outside face transaction recovery.
   * @evidence contracts/development/common.md#meaningful-documentation Names world-mm positions, outward indices and owner/u/v coordinates.
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
   * @evidence contracts/development/design.md#principled-representation Kind selects the retained side and the occurrence chart describes this face independently of the global mesh owner.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Parallel ID/chart arrays make source identity and native cover explicit.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Coincident distinct IDs are not welded. A repeated ID needs exactly equal station and phase equal to its first authority plus an integer period in binary64; inexact translations are an encoding refusal, not proof of invalid anatomy. Local periodic primitives retain the kept-side reader's family.
   * @evidence contracts/development/common.md#meaningful-documentation Documents hole/island/start/end and unwrapped native chart order.
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
   * @evidence contracts/development/design.md#principled-representation Carries rail chart columns, retained side and optional atlas source-face IDs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Separates pre-vertex source data from the indexed ILoop.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Does not prove rail correspondence or fit a new curve.
   * @evidence contracts/development/common.md#meaningful-documentation Names column order, native chart and absent atlas-face meaning.
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
   * @evidence contracts/development/design.md#principled-representation The source, original trim IDs and finite grid define a constrained region; the declared source sign turns its native chart outward.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Optional onFailure is the named-planning recovery seam, separate from ordinary source exceptions.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Absence or explicit undefined throws on named refusal before mesh append. Recording a refusal can leave other faces/seams present, which is a partial result rather than a valid complete skin.
   * @evidence contracts/development/common.md#meaningful-documentation Documents grid/domain, source coherence, inversion and named/partial endpoint failure semantics.
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
     * @evidence contracts/development/implementation.md#principled-implementation The face owner reports failed indexed-partition premises before append; partial periodic endpoint arcs are reported and excluded from cap/event output.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure An optional synchronous callback is the explicit recovery seam; absence or undefined preserves the throwing default.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not receive or swallow arbitrary source, keeps or callback exceptions; those propagate with their original object. Recording a refusal leaves a partial figure rather than certifying a complete skin.
     * @evidence contracts/development/common.md#meaningful-documentation States named versus thrown failure, partial output and callback-free default semantics.
     * @evidence contracts/development/implementation.md#efficient-algorithms Callback cost belongs to its consumer and is paid only for a reported refusal/partial endpoint, not every triangle.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Each face reports its own current failed premise; no callback effects are memoized or shared across faces.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrowed only for the synchronous face call; it must not mutate or reenter the associated mesh. The planner and mesh do not retain it after return or throw.
     */
    onFailure?: (detail: string) => void;
  }

  /**
   * A drawn boundary carrying its actual face occurrences and closing turn.
   *
   * @evidence contracts/development/design.md#principled-representation Original mesh IDs, native cover coordinates and integer winding come directly from the positive triangle boundary; end is assigned only to a complete constant-station periodic endpoint.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Cap/event consumers read explicit occurrence data instead of a global-ID registry or the first matching foreign chart.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Partial periodic arcs are diagnosed rather than capped; a generic planar rim has end null and is not a pole endpoint.
   * @evidence contracts/development/common.md#meaningful-documentation States positive native traversal, per-occurrence chart, closing winding and endpoint meaning.
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
   * @evidence contracts/development/design.md#principled-representation Each returned rail reuses exactly the seam's original mesh indices.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Host and part are distinct explicit face charts.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A shared vertex identity does not equate two surfaces' chart coordinates.
   * @evidence contracts/development/common.md#meaningful-documentation Names rail ownership and index sharing.
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
   * @evidence contracts/development/implementation.md#principled-implementation Creates empty position, index, chart and owner arrays.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A plain four-array record is sufficient.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Allocates no hidden geometry or cache.
   * @evidence contracts/development/common.md#meaningful-documentation States detached output ownership.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work and initially empty storage.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each request creates a separate mesh.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns all four returned arrays.
   */
  export function create(): IMesh {
    return { positions: [], indices: [], coordinates: [], owners: [] };
  }

  /**
   * Register an unchanged surface by its unique name.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Delegates the existing name lookup and retained jet-point closure to the write owner.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The public façade preserves one registration API.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Same-name equivalence is a caller premise; no positional identity or source freezing is inferred.
   * @evidence contracts/development/common.md#meaningful-documentation Names registration identity and transitive source retention.
   * @evidence contracts/development/implementation.md#efficient-algorithms Scans R existing owner names in O(R).
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Repeated registration of the same name reuses its index.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A new closure persists in the mesh only when the name was absent.
   */
  export function owner(mesh: IMesh, surface: IAutoMovieSolidSurface): number {
    return AutoMovieSolidMeshWrite.owner(mesh, surface);
  }

  /**
   * A published blend between corresponding host and part rail columns.
   *
   * @evidence contracts/development/design.md#principled-representation Original rail chart columns and analytic blend rows define its seam surface.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One input names source surfaces, paired columns and row count.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Corresponding columns, positive rows and coherent source domains are caller premises; no rail fit is introduced.
   * @evidence contracts/development/common.md#meaningful-documentation Names blend station length in mm and paired phase-column semantics.
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
   * @evidence contracts/development/implementation.md#principled-implementation Preserves original source-column/row evaluation and shared rail identity; the tessellation owner admits the actual closed clock/orientation and restores this call's append-only changes on propagated failure.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Tessellate owns seam construction; this façade preserves the public API.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds no fitted correspondence, positional weld or per-triangle reversal.
   * @evidence contracts/development/common.md#meaningful-documentation States original clock columns, legacy default2pi, closed-band admission, authoritative blend orientation, shared indices and append-only failure rollback.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(CR) source evaluations and triangles for C columns and R row intervals, plus owner-name scans and constant-size rollback bookkeeping.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Published rail charts set each boundary point once per seam.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Mesh numbers/owners and returned rail indices persist; grid/triangle scratch is local.
   */
  export function seam(mesh: IMesh, input: ISeam): IJoined {
    return AutoMovieSolidMeshTessellate.seam(mesh, input);
  }

  /**
   * Append an admitted constrained source face and return its native domain boundaries.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Prepares grid, residual index plan and provenance before any append, then uses one declared chart orientation for the whole face.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The face owner coordinates preparation, named diagnostics and one commit.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unsupported topology is never silently omitted. Omitted onFailure throws; arbitrary source, keeps and callback exceptions propagate with the same object before writes.
   * @evidence contracts/development/common.md#meaningful-documentation Returns actual native occurrence/winding/end data and diagnoses partial periodic arcs instead of capping them.
   * @evidence contracts/development/implementation.md#efficient-algorithms Includes grid, bridge/ear/insertion/legalization work and predicate cost; no f1 speed or world-approximation bound is inferred from positive chart area.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses copied source jets, split constraints and original shared IDs within the synchronous call.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Scratch/provenance expires after commit/refusal; mesh owners retain surfaces and returned cycles own copied numeric data.
   */
  export function face(mesh: IMesh, input: IFace): IOpen[] {
    return faceAutoMovieSolidMesh(mesh, input);
  }

  /**
   * Append a caller-authored [edge,next,apex] fan from a returned positive native boundary.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The fan reverses the source boundary traversal before applying source orientation and cutter inversion.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Endpoint/pole admission remains with callers; Tessellate owns index emission.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not cap arbitrary trim arcs or query foreign owner coordinates for a face normal.
   * @evidence contracts/development/common.md#meaningful-documentation States fan traversal, known native orientation and inversion premises.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear triangle emission with no analytic reevaluation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses original boundary indices and the declared orientation sign.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only appended indices survive; the operation adds no retained callback.
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
   * @evidence contracts/development/implementation.md#principled-implementation Uses original world-polyline alignment/arc zipper and one population outward reference.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Returns indices for the caller's shared event buffers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Requires compatible complete cycles and preserves the positions-only Human view; it is not a general trimmed-region fill.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes event correspondence from constrained face tessellation.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear alignment, arc, zipper and normal scans in the two cycle sizes.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses original ring/cycle IDs and the caller's outward reference.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Fresh output triples belong to the caller; scratch expires and no mesh buffer changes.
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
   * @evidence contracts/development/implementation.md#principled-implementation Reads the owner/u/v triple and invokes that owner's original point callback.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One indexed replay preserves the existing API.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Requires valid index/owner data and never substitutes that chart for a foreign face occurrence.
   * @evidence contracts/development/common.md#meaningful-documentation States owner-local inputs and original callback-result ownership.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant indexing plus the source callback's actual cost.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work No replay cache assumes mutable callbacks stayed unchanged.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The three-number slice is local; returned vector ownership follows the source.
   */
  export function evaluate(mesh: IMesh, index: number): Vec3 {
    const c: number[] = mesh.coordinates.slice(3 * index, 3 * index + 3);
    return mesh.owners[c[0]!]!.point(c[1]!, c[2]!);
  }

  /**
   * Append one admitted world-mm point and owner-chart triple.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Copies three world components and owner/u/v into aligned buffers.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The write owner returns the new global index.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Finiteness and chart meaning are caller admission premises; no normalization or positional welding is performed.
   * @evidence contracts/development/common.md#meaningful-documentation Names low-level append ownership and coordinate units.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant amortized append work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Copies the provided evaluated point without a new surface reading.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Six numeric entries persist in mesh; the borrowed vector is not retained.
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

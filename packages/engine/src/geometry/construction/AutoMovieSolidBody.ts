import type { AutoMovieLoftContract } from "./AutoMovieLoftContract";
import type { AutoMovieSolidBlendChain } from "./AutoMovieSolidBlendChain";
import { AutoMovieSolidBodyMerge } from "./AutoMovieSolidBodyMerge";
import type { AutoMovieSolidCycle } from "./AutoMovieSolidCycle";
import type { AutoMovieSolidJoin } from "./AutoMovieSolidJoin";
import { AutoMovieSolidMesh } from "./AutoMovieSolidMesh";
import type { IAutoMovieSolidAtlas } from "./IAutoMovieSolidAtlas";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * A solid built by merges and diffs, as trimmed faces that share their
 * boundaries: the base, every blend and every part, each a surface with its
 * trim cycles in its own chart (`AutoMovieSolidCycle`), the shared
 * boundary vertices held once in the body's mesh.
 *
 * A merge ({@link merge}) traces its part against the body as an atlas
 * ({@link atlas}), so its curve and its host rail cross from face to face
 * (the thigh against the trunk and the gluteal mass, a malleolus on the
 * shank-to-foot blend, the second breast against the first). It adds the
 * blend face (the join's blend chain, its two rails its station-end
 * cycles), gives the part face its rail cycle (a part merged again at its
 * other end keeps both, a limb merged at its root and at its foot), and
 * trims every host face the host rail runs over: a rail on one face adds its
 * loop, a rail that crosses faces is clipped into each face it runs on
 * (`AutoMovieSolidClip`). Where two blends meet (the perineum, the
 * webs, the cleavage), the later merge's rail simply runs over the earlier
 * blend face, so no corner needs its own patch.
 *
 * {@link draw} tessellates every face on its own grid trimmed by its cycles
 * (`AutoMovieSolidMesh.face`), shared boundaries vertex for vertex.
 *
 * @evidence contracts/common.md#principled-implementation A merged solid is a set of trimmed faces sharing boundary vertices, and each merge traces against all faces as one atlas, so a later part can meet an earlier blend.
 * @evidence contracts/common.md#clear-and-simple-design Create, merge, draw and publish over one body record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Returned rail/trim failures restore the original checkpoint; thrown callbacks propagate without that rollback, and no face is patched to close a gap.
 * @evidence contracts/common.md#meaningful-documentation States the faces, their cycles, the merge's steps and the published form.
 * @evidence contracts/performance.md#efficient-algorithms Includes snapshot/atlas work, join tracing or supplied-curve reuse, column publication and clipping; draw includes each face's grid and boundary matching costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Boundary vertices are created once in the shared mesh and referenced by every face that meets them.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns faces, mesh and blend publications; publishing returns detached shared-boundary/face/chart records without retaining surface callbacks.
 */
export namespace AutoMovieSolidBody {
  /**
   * One face.
   *
   * @evidence contracts/common.md#principled-implementation A borrowed surface, tessellation grid and mutable trim cycles describe one body face with an optional cutter orientation.
   * @evidence contracts/common.md#clear-and-simple-design One record keeps source geometry and current chart boundaries together while shared vertices remain in the body's mesh.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The record validates neither grid order nor boundary correspondence, regularity or inclusive cycle ownership.
   * @evidence contracts/common.md#meaningful-documentation Fields identify chart grids, cycle ownership and the optional inward cutter flag.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This data record performs no meshing; draw and the mesh owner execute the grid/classification algorithms.
   * @evidence contracts/performance.md#reuse-equivalent-work Boundary cycles refer to shared mesh indices rather than independently evaluated seam copies.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The body retains its surface, grids and cycles; transitive storage follows grid/segment populations and callback dependencies.
   */
  export interface IFace {
    /** The surface. */
    surface: IAutoMovieSolidSurface;

    /** Grid stations of its tessellation, strictly increasing. */
    stations: number[];

    /** Grid phases of its tessellation, strictly increasing, one period's worth on a periodic face. */
    phases: number[];

    /** Its trim cycles. */
    cycles: AutoMovieSolidCycle.ICycle[];

    /** Whether it is a diff's cutter, drawn facing into the cutter. */
    inverted?: boolean;
  }

  /**
   * The body.
   *
   * @evidence contracts/common.md#principled-implementation Faces share one indexed mesh, while the original blend publications identify the surfaces later joins can use.
   * @evidence contracts/common.md#clear-and-simple-design One mutable aggregate holds assembly order and its published geometric records.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The type proves no manifoldness, closure or mutation safety; draw appends to the current buffers rather than resetting them.
   * @evidence contracts/common.md#meaningful-documentation Members distinguish face, mesh and publication ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A container chooses no transaction, trace or tessellation algorithm.
   * @evidence contracts/performance.md#reuse-equivalent-work One mesh holds shared boundary indices and unique-name surface owners across its faces.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Faces, vertices, triangles and blends grow with caller assembly and remain until the body is dropped; no fixed population bound is enforced.
   */
  export interface IBody {
    /** Name in diagnostics. */
    name: string;

    /** Its faces. */
    faces: IFace[];

    /** The shared vertices (and, after {@link draw}, the triangles). */
    mesh: AutoMovieSolidMesh.IMesh;

    /** Every merge's published blend, in merge order. */
    blends: AutoMovieSolidBlendChain.IBlend[];
  }

  /**
   * A face to add, before it has cycles.
   *
   * @evidence contracts/common.md#principled-implementation A surface and two chart grids describe a face before assembly supplies its cycles.
   * @evidence contracts/common.md#clear-and-simple-design Uses the same surface/grid meanings as the eventual face without pretending it already owns trims.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Finite ordered grids and an appropriate source surface remain caller premises, not validated by the shape.
   * @evidence contracts/common.md#meaningful-documentation States that grid coordinates belong to the source surface chart.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The descriptor executes no tessellation or admission.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Input data schedules no computation; create performs only its original shallow record copy.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The producer owns the borrowed surface/grid arrays; body creation retains those references and creates fresh empty cycles.
   */
  export interface IFaceInput {
    /** The surface. */
    surface: IAutoMovieSolidSurface;

    /** Grid stations. */
    stations: number[];

    /** Grid phases. */
    phases: number[];
  }

  /**
   * One merge or diff onto the body.
   *
   * @evidence contracts/common.md#principled-implementation One request names merge/diff, an existing or new part and the original join/publication grid inputs.
   * @evidence contracts/common.md#clear-and-simple-design Separates body face ownership from the join's surfaces by omitting part/host in the borrowed join request.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Valid indices, count/rows and callbacks remain caller/operator premises; the type adds no numeric fallback.
   * @evidence contracts/common.md#meaningful-documentation States index versus descriptor input, column/row meaning and original callback ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The request performs no tracing, clipping or sampling.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record coordinates no work; a supplied join curve remains available to the existing join owner.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns request records and callbacks; successful body state retains publications rather than the request as a new cache.
   */
  export interface IMerge {
    /** The blend chain's name. */
    name: string;

    /** Merge or diff. */
    kind: "merge" | "diff";

    /** The part: a new face, or the index of a face already in the body (a part merged again at its other end). */
    part: IFaceInput | number;

    /** The join's seed, parameter, trace limits and widths. */
    join: Omit<AutoMovieSolidJoin.IInput, "part" | "host">;

    /** Columns of the published blend, a positive multiple of 4. */
    count: number;

    /** Grid stations of the blend face across its span, at least 1. */
    rows: number;
  }

  /**
   * A merge's outcome.
   *
   * @evidence contracts/common.md#principled-implementation A nullable blend/join pair and ordered diagnostics report the original body operation.
   * @evidence contracts/common.md#clear-and-simple-design Keeps failure information with the exact accepted join and publication without inferring success from empty diagnostics.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The shape does not turn a thrown callback into a returned rollback result or certify global geometry.
   * @evidence contracts/common.md#meaningful-documentation Members distinguish nullable geometry from diagnostics.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This result runs no join or transaction algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record schedules no work; its join and blend are the original operator outputs.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The reader owns diagnostics and returned references; a retained join also retains its original potentially unbounded rail-query cache.
   */
  export interface IMerged {
    /** The published blend, or null when a premise broke. */
    blend: AutoMovieSolidBlendChain.IBlend | null;

    /** The join the blend spans, or null with the blend. */
    join: AutoMovieSolidJoin.IJoin | null;

    /** Every broken premise. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];
  }

  /**
   * A body of base faces, untrimmed.
   *
   * @param name Name in diagnostics.
   * @param faces The base faces.
   * @returns The body.
   *
   * @evidence contracts/common.md#principled-implementation Shallow-copies each input face record, adds its fresh empty cycle array and creates the original empty mesh/blend list.
   * @evidence contracts/common.md#clear-and-simple-design One factory initializes mutable assembly state without sampling geometry.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Retains input surface/grid references and performs no validation or deep-copy substitute.
   * @evidence contracts/common.md#meaningful-documentation Documents the untrimmed starting body and borrowed inputs.
   * @evidence contracts/performance.md#efficient-algorithms Linear in face descriptors, with fresh face/cycle records and empty mesh arrays.
   * @evidence contracts/performance.md#reuse-equivalent-work Does not evaluate or rebuild surfaces; their existing objects remain the source identities.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned body owns its new containers and borrows original surface/grid data; no factory cache is retained.
   */
  export function create(name: string, faces: IFaceInput[]): IBody {
    return {
      name,
      faces: faces.map((f: IFaceInput): IFace => ({ ...f, cycles: [] })),
      mesh: AutoMovieSolidMesh.create(),
      blends: [],
    };
  }

  /**
   * The body as an atlas of its faces, leaving one out (the part of a merge
   * that is already a face).
   *
   * @param body The body.
   * @param without A face index to leave out, or -1.
   * @returns The atlas and the body index of each atlas face.
   *
   * @evidence contracts/common.md#principled-implementation Delegates to the same frozen-cycle host snapshot with live source surfaces and original body-index mapping.
   * @evidence contracts/common.md#clear-and-simple-design Retains the public atlas API while the assembly owner keeps snapshot logic beside its transaction.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves kept/across callbacks, chart-foot ranking and open-neighbour nulls; inclusive-boundary limitations remain.
   * @evidence contracts/common.md#meaningful-documentation States captured trim state versus borrowed surface data.
   * @evidence contracts/performance.md#efficient-algorithms Includes O(F+S) snapshot work and later per-face cycle/segment scans in the helper.
   * @evidence contracts/performance.md#reuse-equivalent-work One returned atlas shares its original frozen cycles and back-index map across queries.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains captured cycles/maps and surfaces until dropping the atlas; the façade adds no cache.
   */
  export function atlas(
    body: IBody,
    without: number = -1,
  ): { atlas: IAutoMovieSolidAtlas; index: number[] } {
    return AutoMovieSolidBodyMerge.atlas(body, without);
  }

  /**
   * Merge or cut a part into the body.
   *
   * @param body The body; its faces, cycles and mesh grow in place.
   * @param input The merge.
   * @returns The blend or null with observed diagnostics. Returned rail/trim failures restore face count, copied cycles and mesh populations; thrown callbacks are not caught or rolled back.
   *
   * @evidence contracts/common.md#principled-implementation Calls the unchanged transactional assembly with the same body and input references.
   * @evidence contracts/common.md#clear-and-simple-design Maintains the public namespace/signature while the merge owner contains the complete operation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not catch, retry, alter diagnostics or expand the checkpoint; returned failure and thrown effects remain distinct.
   * @evidence contracts/common.md#meaningful-documentation States in-place assembly and the original returned-failure rollback scope.
   * @evidence contracts/performance.md#efficient-algorithms Includes checkpoint, atlas, join, publication and clipping costs, not just the delegation call.
   * @evidence contracts/performance.md#reuse-equivalent-work The helper preserves shared boundary indices and supplied trace reuse at their original owners.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Successful body data and returned join/blend references retain their original populations; no extra façade state survives.
   */
  export function merge(body: IBody, input: IMerge): IMerged {
    return AutoMovieSolidBodyMerge.merge(body, input);
  }

  /**
   * Tessellate every face.
   *
   * @param body The body; its mesh receives the triangles.
   * @returns Each face's open ends (vertex cycles), by face.
   *
   * @evidence contracts/common.md#principled-implementation Draws every face on its original grid and cycles into the existing shared mesh.
   * @evidence contracts/common.md#clear-and-simple-design One ordered face map returns the same residual open cycles by face.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not reset buffers or prove every residual cycle is a legitimate endpoint; repeated draws append again.
   * @evidence contracts/common.md#meaningful-documentation States mesh mutation and returned cycle/index ownership.
   * @evidence contracts/performance.md#efficient-algorithms Includes each face's grid jets, classification, candidate matching and zipper work.
   * @evidence contracts/performance.md#reuse-equivalent-work Reads existing shared rail vertices and surface owners instead of independently welding boundaries.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The body retains appended geometry; temporary face work expires and returned open-cycle arrays belong to the caller.
   */
  export function draw(body: IBody): number[][][] {
    return body.faces.map((f: IFace): number[][] =>
      AutoMovieSolidMesh.face(body.mesh, {
        surface: f.surface,
        stations: f.stations,
        phases: f.phases,
        loops: f.cycles.map(
          (c: AutoMovieSolidCycle.ICycle): AutoMovieSolidMesh.ILoop => ({
            kind: c.kind,
            vertices: c.vertices,
            chart: c.chart,
          }),
        ),
        inverted: f.inverted,
      }),
    );
  }

  /**
   * A body as data, for a calibration (`IAutoMovieHumanBodyCalibration.bodies`):
   * the shared boundary points, each named by the face that evaluates it and
   * its chart point there, and each face by its chain's name with its trim
   * cycles as indices into those points. The skin (`AutoMovieHumanBodySurfaceSolids`)
   * makes one vertex per point, so the faces share their boundaries as the
   * body does.
   *
   * @evidence contracts/common.md#principled-implementation Renumbers shared cycle vertex indices into boundary point identities and names each evaluating chain/chart.
   * @evidence contracts/common.md#clear-and-simple-design A serializable boundary projection omits surface callbacks and full interior tessellation buffers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries declared cycles/inversion without proving closed topology or repairing missing geometry.
   * @evidence contracts/common.md#meaningful-documentation States chain/chart correspondence and that faces reference shared point identifiers.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This data type performs no remapping; publish owns its linear boundary traversal.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record coordinates no work; shared point identifiers avoid duplicating the same boundary vertex in its projection.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns detached face/cycle/chart arrays sized by boundary records; no body mesh or evaluator closure is retained by the produced projection.
   */
  export interface IPublished {
    /** Name in diagnostics. */
    name: string;

    /** The shared boundary points: the chain that evaluates each, and its chart point there. */
    points: { chain: string; chart: [number, number] }[];

    /** The faces, each a chain of the calibration. */
    faces: {
      /** The chain's name: the face's surface name. */
      chain: string;

      /** Its trim cycles, as points. */
      cycles: {
        kind: AutoMovieSolidCycle.ICycle["kind"];
        points: number[];
        chart: [number, number][];
      }[];

      /** Whether it is a diff's cutter. */
      inverted?: boolean;
    }[];
  }

  /**
   * A body as data: the vertices its cycles use, renumbered as points.
   *
   * @param body The body, its faces' surfaces named after their chains.
   * @returns The published body.
   *
   * @evidence contracts/common.md#principled-implementation Walks face cycles in order and assigns one published point to each first-seen shared mesh index.
   * @evidence contracts/common.md#clear-and-simple-design One map preserves shared boundary identity while projecting owners to chain names and chart coordinates.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not include the full mesh or certify geometry; valid owner coordinates are the current body premise.
   * @evidence contracts/common.md#meaningful-documentation States renumbering, chain/chart identity and detached cycle charts.
   * @evidence contracts/performance.md#efficient-algorithms Linear in faces and boundary records, with one expected-constant map lookup per referenced vertex.
   * @evidence contracts/performance.md#reuse-equivalent-work The same mesh index reuses its earlier published identifier across all faces.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns fresh boundary/face/chart arrays; the local index map and body reference are not retained by that projection.
   */
  export function publish(body: IBody): IPublished {
    /** Renumber each first-seen boundary vertex once. */
    const index: Map<number, number> = new Map();

    /** Detached shared-boundary point records for this publication. */
    const points: IPublished["points"] = [];

    /** Read the original owner/chart coordinates when a boundary index first appears. */
    const point: (v: number) => number = (v: number): number => {
      /** Previously published identity for this same mesh vertex. */
      const known: number | undefined = index.get(v);
      if (known !== undefined) return known;

      /** Original owner and chart entries for this referenced boundary vertex. */
      const c: number[] = body.mesh.coordinates.slice(3 * v, 3 * v + 3);
      points.push({
        chain: body.mesh.owners[c[0]!]!.name,
        chart: [c[1]!, c[2]!],
      });
      index.set(v, points.length - 1);
      return points.length - 1;
    };
    return {
      name: body.name,
      points,
      faces: body.faces.map((f: IFace): IPublished["faces"][number] => ({
        chain: f.surface.name,
        cycles: f.cycles.map(
          (
            c: AutoMovieSolidCycle.ICycle,
          ): IPublished["faces"][number]["cycles"][number] => ({
            kind: c.kind,
            points: c.vertices.map(point),
            chart: c.chart.map((p: [number, number]): [number, number] => [
              p[0],
              p[1],
            ]),
          }),
        ),
        ...(f.inverted === true ? { inverted: true } : {}),
      })),
    };
  }

  /**
   * Whether a chart point lies in a face's kept region: on the kept side of
   * every cycle.
   *
   * @param face The face.
   * @param u Its `u`.
   * @param v Its `v`.
   * @returns True when kept.
   *
   * @evidence contracts/common.md#principled-implementation Delegates the same ordered conjunction of current cycle predicates using the surface's period.
   * @evidence contracts/common.md#clear-and-simple-design Keeps the public face reader while atlas/assembly share its actual implementation owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no boundary tolerance or domain policy; current parity does not certify inclusive boundary ownership.
   * @evidence contracts/common.md#meaningful-documentation States the live kept-side query and its boolean result.
   * @evidence contracts/performance.md#efficient-algorithms Includes the helper's reached cycle/segment scans.
   * @evidence contracts/performance.md#reuse-equivalent-work Reads current face cycles without introducing a stale query cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a scalar without retaining the face or coordinates.
   */
  export function kept(face: IFace, u: number, v: number): boolean {
    return AutoMovieSolidBodyMerge.kept(face, u, v);
  }
}

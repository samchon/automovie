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
 * @evidence contracts/development/common.md#meaningful-documentation States the faces, their cycles, the merge's steps and the published form.
 * @evidence contracts/development/design.md#principled-representation Represents A solid built by merges and diffs, as trimmed faces that share their boundaries: the base, every blend and every part, each a surface with its trim cycles in its own chart (`AutoMovieSolidCycle`), the shared boundary vertices held once in the body's mesh: companion namespace of 12 members (`IFace`, `IBody`, `IFaceInput`, `IMerge`, `IMerged`, `create`, ...); units and frames named in its text: local. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieSolidBody` in packages/engine/src/geometry/construction/AutoMovieSolidBody.ts; its surface is the 12 members listed and the text shows 26 other files naming it, mostly packages/engine (14), test (7), packages/human (5), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieSolidBody {
  /**
   * One face.
   *
   * @evidence contracts/development/design.md#principled-representation A borrowed surface, tessellation grid and mutable trim cycles describe one body face with an optional cutter orientation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One record keeps source geometry and current chart boundaries together while shared vertices remain in the body's mesh.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The record validates neither grid order nor boundary correspondence, regularity or inclusive cycle ownership.
   * @evidence contracts/development/common.md#meaningful-documentation Fields identify chart grids, cycle ownership and the optional inward cutter flag.
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

    /** Original source atlas and stable body-index translation; immutable while this face is retained. */
    sourceAtlas?: { atlas: IAutoMovieSolidAtlas; face: number; offset: number };

    /** Shared source-chart tessellation boundaries; these do not trim the original analytic atlas. */
    meshLoops?: AutoMovieSolidMesh.ILoop[];

    /** Whether it is a diff's cutter, drawn facing into the cutter. */
    inverted?: boolean;
  }

  /**
   * The body.
   *
   * @evidence contracts/development/design.md#principled-representation Faces share one indexed mesh, while the original blend publications identify the surfaces later joins can use.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One mutable aggregate holds assembly order and its published geometric records.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The type proves no manifoldness, closure or mutation safety; draw appends to the current buffers rather than resetting them.
   * @evidence contracts/development/common.md#meaningful-documentation Members distinguish face, mesh and publication ownership.
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
   * @evidence contracts/development/design.md#principled-representation A surface and two chart grids describe a face before assembly supplies its cycles.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Uses the same surface/grid meanings as the eventual face without pretending it already owns trims.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Finite ordered grids and an appropriate source surface remain caller premises, not validated by the shape.
   * @evidence contracts/development/common.md#meaningful-documentation States that grid coordinates belong to the source surface chart.
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
   * @evidence contracts/development/design.md#principled-representation One request names merge/diff, an existing or new part and the original join/publication grid inputs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Separates body face ownership from the join's surfaces by omitting part/host in the borrowed join request.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Valid indices, count/rows and callbacks remain caller/operator premises; the type adds no numeric fallback.
   * @evidence contracts/development/common.md#meaningful-documentation States index versus descriptor input, column/row meaning and original callback ownership.
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
   * @evidence contracts/development/design.md#principled-representation A nullable blend/join pair and ordered diagnostics report the original body operation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps failure information with the exact accepted join and publication without inferring success from empty diagnostics.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The shape does not turn a thrown callback into a returned rollback result or certify global geometry.
   * @evidence contracts/development/common.md#meaningful-documentation Members distinguish nullable geometry from diagnostics.
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
   * @evidence contracts/development/implementation.md#principled-implementation Shallow-copies each input face record, adds its fresh empty cycle array and creates the original empty mesh/blend list.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One factory initializes mutable assembly state without sampling geometry.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains input surface/grid references and performs no validation or deep-copy substitute.
   * @evidence contracts/development/common.md#meaningful-documentation Documents the untrimmed starting body and borrowed inputs.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in face descriptors, with fresh face/cycle records and empty mesh arrays.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Does not evaluate or rebuild surfaces; their existing objects remain the source identities.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned body owns its new containers and borrows original surface/grid data; no factory cache is retained.
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
   * @evidence contracts/development/implementation.md#principled-implementation Delegates to the same frozen-cycle host snapshot with live source surfaces and original body-index mapping.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Retains the public atlas API while the assembly owner keeps snapshot logic beside its transaction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves kept/across callbacks, chart-foot ranking and open-neighbour nulls; inclusive-boundary limitations remain.
   * @evidence contracts/development/common.md#meaningful-documentation States captured trim state versus borrowed surface data.
   * @evidence contracts/development/implementation.md#efficient-algorithms Includes O(F+S) snapshot work and later per-face cycle/segment scans in the helper.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One returned atlas shares its original frozen cycles and back-index map across queries.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller retains captured cycles/maps and surfaces until dropping the atlas; the façade adds no cache.
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
   * @evidence contracts/development/implementation.md#principled-implementation Calls the unchanged transactional assembly with the same body and input references.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Maintains the public namespace/signature while the merge owner contains the complete operation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not catch, retry, alter diagnostics or expand the checkpoint; returned failure and thrown effects remain distinct.
   * @evidence contracts/development/common.md#meaningful-documentation States in-place assembly and the original returned-failure rollback scope.
   * @evidence contracts/development/implementation.md#efficient-algorithms Includes checkpoint, atlas, join, publication and clipping costs, not just the delegation call.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The helper preserves shared boundary indices and supplied trace reuse at their original owners.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Successful body data and returned join/blend references retain their original populations; no extra façade state survives.
   */
  export function merge(body: IBody, input: IMerge): IMerged {
    return AutoMovieSolidBodyMerge.merge(body, input);
  }

  /**
   * Tessellate every face.
   *
   * @param body The body; its mesh receives the triangles.
   * @param onFailure Optional face-name/detail receiver for named planning failures; absence preserves the throwing default.
   * @returns Each face's explicit native boundary occurrences and complete endpoint classification, by face.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Draws every face on its original grid and cycles into the existing shared mesh.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordered face map preserves explicit chart/winding/end records and adapts a present diagnostic callback to its actual face name.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not install a no-op callback when none was supplied; named refusal then throws. A supplied receiver can leave other faces and seams present, so its result may be partial. Repeated draws still append again.
   * @evidence contracts/development/common.md#meaningful-documentation States mesh mutation, callback/default exception semantics and explicit occurrence ownership.
   * @evidence contracts/development/implementation.md#efficient-algorithms Includes each face's grid, constrained residual triangulation, incidence and callback costs.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads existing shared rail vertices and surface owners instead of independently welding boundaries.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The body retains appended geometry; temporary face work expires and returned open-cycle arrays belong to the caller.
   */
  export function draw(
    body: IBody,
    onFailure?: (face: string, detail: string) => void,
  ): AutoMovieSolidMesh.IOpen[][] {
    return body.faces.map((f: IFace): AutoMovieSolidMesh.IOpen[] =>
      AutoMovieSolidMesh.face(body.mesh, {
        surface: f.surface,
        stations: f.stations,
        phases: f.phases,
        domainLoops: f.meshLoops,
        loops: f.cycles.map(
          (c: AutoMovieSolidCycle.ICycle): AutoMovieSolidMesh.ILoop => ({
            kind: c.kind,
            vertices: c.vertices,
            chart: c.chart,
          }),
        ),
        inverted: f.inverted,
        onFailure:
          onFailure === undefined
            ? undefined
            : (detail: string): void => onFailure(f.surface.name, detail),
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
   * @evidence contracts/development/design.md#principled-representation Renumbers shared cycle vertex indices into boundary point identities and names each evaluating chain/chart.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A serializable boundary projection omits surface callbacks and full interior tessellation buffers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Preserves domain versus cut roles through serialization; carries inversion without proving closed topology, standalone source availability or repaired geometry.
   * @evidence contracts/development/common.md#meaningful-documentation States chain/chart correspondence and that faces reference shared point identifiers.
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

      /** Original grid-side authorities, separate from actual cuts; absent in legacy publications. Same shared point IDs and this-face charts are retained. Mesh admission still requires actual domain sides and supported roles. */
      domainLoops?: IPublished["faces"][number]["cycles"];

      /** Sampling chart bounds published with domainLoops, distinct from original source ownership. Periodic phases are first/last unrepeated samples; their period remains the actual surface period. */
      grid?: {
        /** First/last regular sampling station, kernel mm. */
        stations: [number, number];

        /** First/last sampling phase in the source chart's actual units. */
        phases: [number, number];
      };

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
   * @evidence contracts/development/implementation.md#principled-implementation Publishes original domain authorities and actual trim cycles into separate fields, assigning one shared point to each first-seen mesh index across both roles.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One map preserves shared boundary identity while projecting owners to chain names and chart coordinates.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not include the full mesh or certify geometry; valid owner coordinates are the current body premise.
   * @evidence contracts/development/common.md#meaningful-documentation States renumbering, original-domain versus cutting roles, actual sampling bounds distinct from source ownership, chain/chart identity and detached boundary charts.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in faces and boundary records, with one expected-constant map lookup per referenced vertex.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same mesh index reuses its earlier published identifier across all faces.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh boundary/face/chart arrays; the local index map and body reference are not retained by that projection.
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
    /** Copy one boundary record while retaining the one shared point identity across either role. */
    const cycle: (
      c: AutoMovieSolidMesh.ILoop,
    ) => IPublished["faces"][number]["cycles"][number] = (
      c: AutoMovieSolidMesh.ILoop,
    ): IPublished["faces"][number]["cycles"][number] => ({
      kind: c.kind,
      points: c.vertices.map(point),
      chart: c.chart.map((p: [number, number]): [number, number] => [
        p[0],
        p[1],
      ]),
    });
    return {
      name: body.name,
      points,
      faces: body.faces.map((f: IFace): IPublished["faces"][number] => {
        const domains: IPublished["faces"][number]["cycles"] | undefined =
          f.meshLoops?.map(cycle);
        const grid: IPublished["faces"][number]["grid"] =
          domains === undefined
            ? undefined
            : {
                stations: [f.stations[0]!, f.stations[f.stations.length - 1]!],
                phases: [f.phases[0]!, f.phases[f.phases.length - 1]!],
              };
        return {
          chain: f.surface.name,
          cycles: f.cycles.map(cycle),
          ...(domains === undefined
            ? {}
            : { domainLoops: domains, grid: grid! }),
          ...(f.inverted === true ? { inverted: true } : {}),
        };
      }),
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
   * @evidence contracts/development/implementation.md#principled-implementation Delegates the same ordered conjunction of current cycle predicates using the surface's period.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Keeps the public face reader while atlas/assembly share its actual implementation owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds no boundary tolerance or domain policy; current parity does not certify inclusive boundary ownership.
   * @evidence contracts/development/common.md#meaningful-documentation States the live kept-side query and its boolean result.
   * @evidence contracts/development/implementation.md#efficient-algorithms Includes the helper's reached cycle/segment scans.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads current face cycles without introducing a stale query cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a scalar without retaining the face or coordinates.
   */
  export function kept(face: IFace, u: number, v: number): boolean {
    return AutoMovieSolidBodyMerge.kept(face, u, v);
  }
}

import type { IAutoMovieLoftContract } from "./IAutoMovieLoftContract";
import type { IAutoMovieSolidAtlas } from "./IAutoMovieSolidAtlas";
import type { IAutoMovieSolidBlendChain } from "./IAutoMovieSolidBlendChain";
import type { IAutoMovieSolidCycle } from "./IAutoMovieSolidCycle";
import type { IAutoMovieSolidJoin } from "./IAutoMovieSolidJoin";
import type { IAutoMovieSolidMesh } from "./IAutoMovieSolidMesh";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * Mutable multi-face solid assembly, merge outcomes and serialized boundaries.
 *
 * @evidence contracts/development/design.md#principled-representation Body faces retain original surface charts while shared mesh IDs and neighbor cycles connect their boundaries.
 * @evidence contracts/development/design.md#minimal-and-owned-surface SolidBody creates, draws and publishes this state; BodyMerge owns atlas snapshots and merge/diff updates.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Assembly records are not certificates of closure or manifoldness; callers preserve source/chart ownership and the append-only mutation protocol.
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes live body ownership, sampled grids and serialized source addresses.
 */
export namespace IAutoMovieSolidBody {
  /**
   * One face.
   *
   * @evidence contracts/development/design.md#principled-representation A borrowed surface, tessellation grid and mutable trim cycles describe one body face with an optional cutter orientation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One record keeps source geometry and current chart boundaries together while shared vertices remain in the body's mesh.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The record validates neither grid order nor boundary correspondence, regularity or inclusive cycle ownership.
   * @evidence contracts/development/common.md#meaningful-documentation Fields identify chart grids, cycle ownership and the optional inward cutter flag.
   */
  export interface IFace {
    /** Borrowed analytic surface; keep its geometry and chart identity stable while the face or an atlas snapshot retains it. */
    surface: IAutoMovieSolidSurface;

    /** Finite strictly increasing samples of surface u, in that chart's units, usually station millimetres; shared arrays may be retained from inputs. */
    stations: number[];

    /** Finite increasing surface-v samples: radians for lofts, normalized piece coordinates for profiles; a periodic face omits its repeated endpoint. */
    phases: number[];

    /** Its trim cycles. */
    cycles: IAutoMovieSolidCycle.ICycle[];

    /** Original source atlas and stable body-index translation; immutable while this face is retained. */
    sourceAtlas?: {
      /** Original profile atlas supplying analytic retained-domain and adjacency checks; absent leaves only this face's trim cycles. */
      atlas: IAutoMovieSolidAtlas;

      /** Index of this surface in the original atlas. */
      face: number;

      /** Add to an original atlas neighbor index to obtain its body face index. */
      offset: number;
    };

    /** Shared source-chart tessellation boundaries; these do not trim the original analytic atlas. */
    meshLoops?: IAutoMovieSolidMesh.ILoop[];

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
    faces: IAutoMovieSolidBody.IFace[];

    /** Mutable shared vertex buffers and triangles; SolidBody.draw appends triangles without resetting prior content. */
    mesh: IAutoMovieSolidMesh.IMesh;

    /** Every merge's published blend, in merge order. */
    blends: IAutoMovieSolidBlendChain.IBlend[];
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
    /** Borrowed source surface retained by create or merge; it is not cloned. */
    surface: IAutoMovieSolidSurface;

    /** Finite increasing u-coordinate samples in the source chart's units, usually millimetres; create retains the array without validation. */
    stations: number[];

    /** Finite increasing v-coordinate samples in the source chart's units, with no repeated periodic endpoint; create retains the array. */
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
    part: IAutoMovieSolidBody.IFaceInput | number;

    /** The join's seed, parameter, trace limits and widths. */
    join: Omit<IAutoMovieSolidJoin.IInput, "part" | "host">;

    /** Uniform columns of the published blend, an integer at least 8 divisible by 4; BlendChain.of rejects other counts. */
    count: number;

    /** Positive integer subdivision count across the blend span, yielding rows+1 station samples; BodyMerge relies on this caller premise. */
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
    blend: IAutoMovieSolidBlendChain.IBlend | null;

    /** The join the blend spans, or null with the blend. */
    join: IAutoMovieSolidJoin.IJoin | null;

    /** Every broken premise. */
    diagnostics: IAutoMovieLoftContract.IDiagnostic[];
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
    points: {
      /** Name of the registered source surface that evaluates this shared vertex. */
      chain: string;

      /** [u,v] in that source's actual chart units; this authority may differ from an incident face's chart below. */
      chart: [number, number];
    }[];

    /** The faces, each a chain of the calibration. */
    faces: {
      /** The chain's name: the face's surface name. */
      chain: string;

      /** Its trim cycles, as points. */
      cycles: {
        /** Retained-side role copied from the original cut cycle or domain loop. */
        kind: IAutoMovieSolidCycle.ICycle["kind"];

        /** Indices into this publication's points array, in boundary traversal order. */
        points: number[];

        /** Matching boundary coordinates in this face's chart, in the same order as points. */
        chart: [number, number][];
      }[];

      /** Original grid-side authorities, separate from actual cuts; absent in legacy publications. Same shared point IDs and this-face charts are retained. Mesh admission still requires actual domain sides and supported roles. */
      domainLoops?: IAutoMovieSolidBody.IPublished["faces"][number]["cycles"];

      /** Sampling chart bounds published with domainLoops, distinct from original source ownership. Periodic phases are first/last unrepeated samples; their period remains the actual surface period. */
      grid?: {
        /** First/last regular u sample in the surface's own chart units, usually kernel millimetres. */
        stations: [number, number];

        /** First/last sampling phase in the source chart's actual units. */
        phases: [number, number];
      };

      /** Whether it is a diff's cutter. */
      inverted?: boolean;
    }[];
  }

  /**
   * The body as an atlas of its faces, leaving one out (the part of a merge
   * that is already a face).
   * The atlas snapshots cycle data and source-atlas address records, while
   * surface functions and cycle along callbacks remain borrowed. The index
   * array translates the compact atlas face order back into the body.
   *
   * @evidence contracts/development/design.md#principled-representation Separates compact solver face indices from mutable body assembly indices without changing any surface chart units.
   * @evidence contracts/development/design.md#minimal-and-owned-surface BodyMerge passes the atlas to joins and the reverse index to rail clipping.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The snapshot isolates later cycle edits but cannot isolate mutations to borrowed surfaces or callbacks.
   * @evidence contracts/development/common.md#meaningful-documentation States index direction and copied versus retained dependencies.
   */
  export type IAtlasResult = {
    /** Atlas of all included body faces with cycle state captured at construction. */
    atlas: IAutoMovieSolidAtlas;

    /** index[k] is the body face index corresponding to atlas.faces[k]; empty when no faces are included. */
    index: number[];
  };
}

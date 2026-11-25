import type { IAutoMovieLoftContract } from "./IAutoMovieLoftContract";
import type { IAutoMovieSolidAtlas } from "./IAutoMovieSolidAtlas";
import type { IAutoMovieSolidBlendChain } from "./IAutoMovieSolidBlendChain";
import type { IAutoMovieSolidCycle } from "./IAutoMovieSolidCycle";
import type { IAutoMovieSolidJoin } from "./IAutoMovieSolidJoin";
import type { IAutoMovieSolidMesh } from "./IAutoMovieSolidMesh";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/** Mutable multi-face solid assembly, merge outcomes and serialized boundaries. */
export namespace IAutoMovieSolidBody {
  /** One face. */
  export interface IFace {
    /**
     * Borrowed analytic surface; keep its geometry and chart identity stable
     * while the face or an atlas snapshot retains it.
     */
    surface: IAutoMovieSolidSurface;

    /**
     * Finite strictly increasing samples of surface u, in that chart's units,
     * usually station millimetres; shared arrays may be retained from inputs.
     */
    stations: number[];

    /**
     * Finite increasing surface-v samples: radians for lofts, normalized piece
     * coordinates for profiles; a periodic face omits its repeated endpoint.
     */
    phases: number[];

    /** Its trim cycles. */
    cycles: IAutoMovieSolidCycle.ICycle[];

    /**
     * Original source atlas and stable body-index translation; immutable while
     * this face is retained.
     */
    sourceAtlas?: {
      /**
       * Original profile atlas supplying analytic retained-domain and adjacency
       * checks; absent leaves only this face's trim cycles.
       */
      atlas: IAutoMovieSolidAtlas;

      /** Index of this surface in the original atlas. */
      face: number;

      /** Add to an original atlas neighbor index to obtain its body face index. */
      offset: number;
    };

    /**
     * Shared source-chart tessellation boundaries; these do not trim the
     * original analytic atlas.
     */
    meshLoops?: IAutoMovieSolidMesh.ILoop[];

    /** Whether it is a diff's cutter, drawn facing into the cutter. */
    inverted?: boolean;
  }

  /** The body. */
  export interface IBody {
    /** Name in diagnostics. */
    name: string;

    /** Its faces. */
    faces: IAutoMovieSolidBody.IFace[];

    /**
     * Mutable shared vertex buffers and triangles; SolidBody.draw appends
     * triangles without resetting prior content.
     */
    mesh: IAutoMovieSolidMesh.IMesh;

    /** Every merge's published blend, in merge order. */
    blends: IAutoMovieSolidBlendChain.IBlend[];
  }

  /** A face to add, before it has cycles. */
  export interface IFaceInput {
    /** Borrowed source surface retained by create or merge; it is not cloned. */
    surface: IAutoMovieSolidSurface;

    /**
     * Finite increasing u-coordinate samples in the source chart's units,
     * usually millimetres; create retains the array without validation.
     */
    stations: number[];

    /**
     * Finite increasing v-coordinate samples in the source chart's units, with
     * no repeated periodic endpoint; create retains the array.
     */
    phases: number[];
  }

  /** One merge or diff onto the body. */
  export interface IMerge {
    /** The blend chain's name. */
    name: string;

    /** Merge or diff. */
    kind: "merge" | "diff";

    /**
     * The part: a new face, or the index of a face already in the body (a part
     * merged again at its other end).
     */
    part: IAutoMovieSolidBody.IFaceInput | number;

    /** The join's seed, parameter, trace limits and widths. */
    join: Omit<IAutoMovieSolidJoin.IInput, "part" | "host">;

    /**
     * Uniform columns of the published blend, an integer at least 8 divisible
     * by 4; BlendChain.of rejects other counts.
     */
    count: number;

    /**
     * Positive integer subdivision count across the blend span, yielding rows+1
     * station samples; BodyMerge relies on this caller premise.
     */
    rows: number;
  }

  /** A merge's outcome. */
  export interface IMerged {
    /** The published blend, or null when a premise broke. */
    blend: IAutoMovieSolidBlendChain.IBlend | null;

    /** The join the blend spans, or null with the blend. */
    join: IAutoMovieSolidJoin.IJoin | null;

    /** Every broken premise. */
    diagnostics: IAutoMovieLoftContract.IDiagnostic[];
  }

  /**
   * A body as data, for a calibration
   * (`IAutoMovieHumanBodyCalibration.bodies`): the shared boundary points, each
   * named by the face that evaluates it and its chart point there, and each
   * face by its chain's name with its trim cycles as indices into those points.
   * The skin (`AutoMovieHumanBodySurfaceSolids`) makes one vertex per point, so
   * the faces share their boundaries as the body does.
   */
  export interface IPublished {
    /** Name in diagnostics. */
    name: string;

    /**
     * The shared boundary points: the chain that evaluates each, and its chart
     * point there.
     */
    points: {
      /**
       * Name of the registered source surface that evaluates this shared
       * vertex.
       */
      chain: string;

      /**
       * [u,v] in that source's actual chart units; this authority may differ
       * from an incident face's chart below.
       */
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

        /**
         * Indices into this publication's points array, in boundary traversal
         * order.
         */
        points: number[];

        /**
         * Matching boundary coordinates in this face's chart, in the same order
         * as points.
         */
        chart: [number, number][];
      }[];

      /**
       * Original grid-side authorities, separate from actual cuts; absent in
       * legacy publications. Same shared point IDs and this-face charts are
       * retained. Mesh admission still requires actual domain sides and
       * supported roles.
       */
      domainLoops?: IAutoMovieSolidBody.IPublished["faces"][number]["cycles"];

      /**
       * Sampling chart bounds published with domainLoops, distinct from
       * original source ownership. Periodic phases are first/last unrepeated
       * samples; their period remains the actual surface period.
       */
      grid?: {
        /**
         * First/last regular u sample in the surface's own chart units, usually
         * kernel millimetres.
         */
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
   * that is already a face). The atlas snapshots cycle data and source-atlas
   * address records, while surface functions and cycle along callbacks remain
   * borrowed. The index array translates the compact atlas face order back into
   * the body.
   */
  export type IAtlasResult = {
    /**
     * Atlas of all included body faces with cycle state captured at
     * construction.
     */
    atlas: IAutoMovieSolidAtlas;

    /**
     * Index[k] is the body face index corresponding to atlas.faces[k]; empty
     * when no faces are included.
     */
    index: number[];
  };
}

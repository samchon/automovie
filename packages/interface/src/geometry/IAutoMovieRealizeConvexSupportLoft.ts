import type { IAutoMovieConvexSupportLoft } from "../model/IAutoMovieConvexSupportLoft";
import type { IAutoMovieMesh } from "../model/IAutoMovieMesh";
import type { IAutoMovieConstructionPolyline } from "../render/IAutoMovieConstructionPolyline";

/** Run controls and receipts for numerical support-loft surface generation. */
export namespace IAutoMovieRealizeConvexSupportLoft {
  /** Numeric admission and work caps for open convex support-loft realization. */
  export interface IControls {
    /**
     * Finite positive metre limit for ruled-face interpolation within the
     * numerical event partition.
     */
    tolerance: number;
    /**
     * Positive safe-integer maximum of supplied support planes. The realizer
     * also requires at least three planes.
     */
    maxPlanes: number;
    /**
     * Nonnegative safe-integer cap on retained feasible interior event
     * stations. Zero is supported.
     */
    maxEvents: number;
    /** Positive safe-integer cap on ruled-face planning cells. */
    maxCells: number;
    /**
     * Positive safe-integer cap on emitted render vertices, checked before
     * transferring the lateral mesh.
     */
    maxVertices: number;
    /**
     * Finite minimum absolute direction determinant in (0, 1) for unit plane
     * normals.
     */
    minimumDirectionSine: number;
  }

  /**
   * Authored adjacent cubic support spans, numerical controls and physical
   * identity domain.
   *
   * The direction set encloses a bounded section. Supply unique plane
   * identities, finite coefficients and an identical endpoint coefficient on
   * neighbouring spans of each plane.
   */
  export interface IInput extends IControls {
    /**
     * Metre-valued cubic offsets over ordered adjacent Y spans, with enclosing
     * unit XZ directions and exact shared endpoint coefficients.
     */
    loft: IAutoMovieConvexSupportLoft;
    /**
     * Nonblank physical namespace for the generated loft instance. Stored
     * physical vertex sources retain the supplied string.
     */
    topologyDomain: string;
  }

  /**
   * Open lateral mesh, construction polylines and diagnostic receipts for one
   * numerical support loft.
   *
   * The event marker grades the numeric construction. A face chord bound covers
   * interpolation within the numerical partition. Boundary agreement and source
   * fit require separate evidence.
   */
  export interface IResult {
    /**
     * Open lateral mesh in local metres with analytic unit normals. End caps
     * and interior fill are absent.
     */
    mesh: IAutoMovieMesh;

    /**
     * Sampled section and boundary polylines. Different lines may share the
     * same coordinate tuples at canonical stations.
     */
    construction: IAutoMovieConstructionPolyline.IMutable[];

    /**
     * Largest measured distance between evaluations of the same canonical
     * boundary vertex, in metres.
     */
    maximumBoundaryDefectMeters: number;

    /**
     * Count of proposed triangles omitted when two corners share a physical
     * source identity.
     */
    omittedCollapsedTriangles: number;

    /**
     * Retained feasible interior event stations across the spans, excluding
     * endpoints.
     */
    events: number;
    /**
     * Total adjacent event-station intervals across all authored polynomial
     * spans.
     */
    intervals: number;
    /**
     * Requested interpolation limit in metres within the numerical partition.
     * Event isolation, boundary roundoff and source fit have separate
     * qualifications.
     */
    faceChordBoundMeters: number;
    /**
     * Fixed marker for binary64 numerical event root and incidence
     * classification.
     */
    eventQualification: "binary64-numerical-not-certified";
  }
}

import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoverySourceHalfedge,
  IAutoMovieRecoverySourceLineage,
  IAutoMovieRecoverySourceTopology,
} from "..";

/** Source geometry and incidence witnessed within one registered physical slab. */
export interface IAutoMovieRecoverySlabObservation {
  /** Physical unit of scalar and Cartesian positions. Always mm. */
  unit: "mm";

  /** Unit cutting normal used for physical source scalar heights. */
  axis: Readonly<AutoMovieVector3Tuple>;

  /** Versioned boundary regular-path rule used to classify PL events. */
  criticalPolicy: "boundary-regular-path-v1";

  /** Requested [before, after] station coordinates in millimetres. */
  boundsMm: [number, number];

  /**
   * Published source scalar nodes, exact aliases and oriented occurrences in
   * original address spaces.
   */
  sourceIncidence: {
    /**
     * Whether clipping preserved raw topology or used exact-position canonical
     * vertex incidence.
     */
    incidence: "raw" | "canonical";

    /** Literal address space for original input triangle ordinals. */
    triangleOrdinalSpace: "input-triangles";

    /** Literal address space for original input vertex ordinals. */
    vertexOrdinalSpace: "input-vertices";

    /**
     * Raw clipping nodes with their join identities and source scalar
     * coordinates.
     */
    nodes: Array<{
      /**
       * Raw clipping-node ID naming one original vertex or a cut-edge
       * intersection.
       */
      id: string;

      /**
       * Joining ID formed with raw or canonical vertex addresses under the
       * selected incidence policy.
       */
      incidenceId: string;

      /**
       * One original vertex ordinal for a vertex node. Two original ordinals
       * identify the edge of a cut intersection.
       */
      vertices: number[];

      /**
       * Physical scalar height of the raw vertex or cut intersection in
       * millimetres.
       */
      scalar: number;
    }>;

    /** Raw node identities associated with the selected incidence IDs. */
    aliases: Array<{
      /** Original clipping-node identity before canonical incidence is applied. */
      rawNode: string;

      /** Incidence identity used to join this raw node in the clipped source. */
      incidenceId: string;
    }>;

    /** Oriented original halfedge occurrences from the clipped source region. */
    occurrences: IAutoMovieRecoverySourceHalfedge[];
  };

  /**
   * Clipped source components with support, observed topology, boundary cycles
   * and issue codes.
   */
  components: Array<{
    /** Component ID within the reported clipped region. */
    id: number;

    /** Original source triangle IDs contributing to this clipped component. */
    sourceTriangleIds: number[];

    /**
     * Manifold, orientability and other observed topology qualifications for
     * the component.
     */
    topology: IAutoMovieRecoverySourceTopology;

    /**
     * Boundary cycles of the clipped component with source orientation and port
     * incidence.
     */
    cycles: Array<{
      /**
       * Before, after or physical for a cycle with one occurrence side. Mixed
       * for multi-side cycles.
       */
      side: "before" | "after" | "physical" | "mixed";

      /**
       * Whether the directed cycle directions are supported by coherent source
       * occurrence orientation.
       */
      orientation: "coherent" | "unqualified";

      /** IDs of published cut ports sharing an occurrence with this cycle. */
      portIds: string[];

      /** Number of directed occurrences in the observed boundary cycle. */
      occurrenceCount: number;

      /** Ordered clipped-incidence node IDs around the boundary cycle. */
      nodes: string[];

      /** Ordered source occurrence IDs and traversal directions for the cycle. */
      occurrences: Array<{
        /** ID into the sourceIncidence occurrences population. */
        id: string;
        /**
         * Cycle traversal direction relative to the occurrence's stored
         * direction.
         */
        direction: 1 | -1;
      }>;
    }>;

    /** Source region issue codes assigned to this component. */
    issueCodes: string[];
  }>;

  /**
   * Per-cut observable contour addresses, incidence attachments and explicit
   * status.
   */
  ports: Array<{
    /** Bound-side section and raw contour address used as the port ID. */
    id: string;

    /** Whether this contour belongs to the lower or upper requested cut. */
    side: "before" | "after";

    /** Signed physical coordinate of the port's observed section in millimetres. */
    coordinateMm: number;

    /** Ordinal of the original raw contour at the observed section. */
    contourIndex: number;

    /**
     * Saved publication status and, when present, its closed loop or open
     * report address.
     */
    publication: IAutoMovieRecoverySourceLineage["publication"];

    /** Original source triangle IDs that actually emitted the cut contour. */
    exactSourceTriangleIds: number[];

    /** Clipped component IDs incident to the published cut support. */
    components: number[];

    /** Source occurrence IDs binding the supported boundary of this port. */
    occurrences: string[];

    /** Whether the source binding is unique, contact only, ambiguous or missing. */
    status: "unique-component" | "contact-only" | "ambiguous" | "missing";

    /**
     * Literal evidence level establishing contour identity without a fitted
     * parameter correspondence.
     */
    parameterCorrespondence: "contour-identity-only";
  }>;

  /**
   * Physical critical observations in the requested interval, including
   * unresolved event links.
   */
  events: Array<{
    /**
     * Source critical identity assembled from its original critical vertex
     * address.
     */
    id: string;

    /**
     * Signed physical scalar position of the source critical event in
     * millimetres.
     */
    coordinateMm: number;

    /** Registered Cartesian source critical point in millimetres. */
    pointMm: Readonly<AutoMovieVector3Tuple>;

    /** Number of observed components in the source event's lower link. */
    lowerComponents: number;

    /** Number of observed components in the source event's upper link. */
    upperComponents: number;

    /** Manifold finding for the original critical link. */
    manifold: boolean;

    /**
     * Whether the original critical event is associated with a flat source
     * level.
     */
    flat: boolean;

    /**
     * Whether source link and bracket admission support a unique incident
     * manifold orientable component without reported issues.
     */
    qualified: boolean;

    /**
     * Measured lower physical event bracket in millimetres, or null if
     * unavailable.
     */
    beforeMm: number | null;

    /**
     * Measured upper physical event bracket in millimetres, or null if
     * unavailable.
     */
    afterMm: number | null;

    /**
     * IDs of clipped components touched by original faces in the critical
     * source star.
     */
    components: number[];

    /**
     * Reasons source event incidence, link or bracket qualification remained
     * unresolved.
     */
    diagnostics: string[];
  }>;

  /**
   * Local source incidence issues with affected original triangles, components
   * and observed ports.
   */
  issues: Array<{
    /** Source region issue category. */
    code: string;

    /** Original source triangle ordinals associated with the issue. */
    sourceTriangleIds: number[];

    /** IDs of clipped components whose issue references include this finding. */
    components: number[];

    /**
     * IDs of published cuts incident to the issue as reported by the source
     * region.
     */
    portIds: string[];
  }>;
}

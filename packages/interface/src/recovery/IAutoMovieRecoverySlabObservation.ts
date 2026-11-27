import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoverySourceHalfedge,
  IAutoMovieRecoverySourceLineage,
  IAutoMovieRecoverySourceTopology,
} from "..";

/**
 * Acquisition-only source incidence for a finite observed slab. Input face
 * ordinals and slab-local occurrence identities bind measured ports and source
 * topology; this record is not engine generation input. Source positions,
 * triangle arrays and normals are absent except for measured critical
 * positions. Critical brackets identify source intervals rather than fitted
 * curves at those brackets.
 */
export interface IAutoMovieRecoverySlabObservation {
  /** Spatial and scalar coordinate unit for this acquisition record. */
  unit: "mm";

  /**
   * Actual normalized source projection direction, shared with the cutter and
   * PL classifier.
   */
  axis: Readonly<AutoMovieVector3Tuple>;

  /**
   * Maintained conservative boundary-link classifier used for event
   * qualification.
   */
  criticalPolicy: "boundary-regular-path-v1";

  /**
   * Signed lower and upper bounds along the fixed observation's normalized
   * axis, millimetres.
   */
  boundsMm: [number, number];

  /**
   * Copied source-address registries from this slab's actual clipped-cell
   * observation. IDs are opaque and local to this slab; they must not be parsed
   * or reused across observations. This metadata supplies address joins, not
   * curve phase, surface coefficients or generation geometry.
   */
  sourceIncidence: {
    /** Actual declared source-incidence policy used for this observation. */
    incidence: "raw" | "canonical";

    /**
     * All face addresses in this record index the supplied triangles array. A
     * selected mesh retains its selected local ordinals; the caller owns any
     * map to an external original mesh.
     */
    triangleOrdinalSpace: "input-triangles";

    /**
     * Node vertex memberships index the supplied verticesMm array,
     * independently of any face selection or external vertex numbering.
     */
    vertexOrdinalSpace: "input-vertices";

    /**
     * Every observed raw node, including contacts and aliases. Scalar values
     * are signed millimetres on axis; memberships retain original input vertex
     * addresses without coordinates.
     */
    nodes: Array<{
      /** Raw endpoint address referenced by occurrence from/to. */
      id: string;

      /**
       * Declared incidence address referenced by cycle nodes; multiple raw
       * nodes may share it.
       */
      incidenceId: string;

      /**
       * Original input vertex memberships: one source vertex or the two
       * endpoints of a clipped source edge.
       */
      vertices: number[];

      /** Actual source projection or clipping-plane coordinate, millimetres. */
      scalar: number;
    }>;

    /**
     * Existing raw-node to incidence-address aliases, copied without merging
     * their memberships. Unlisted raw nodes have identical raw and incidence
     * addresses.
     */
    aliases: Array<{
      /** Raw node address in nodes. */
      rawNode: string;

      /** Shared declared incidence address of that raw node. */
      incidenceId: string;
    }>;

    /**
     * Every observed two-cell halfedge occurrence, including interior edges.
     * Cycle and port occurrence IDs join here. Side names describe scalar
     * strata; physicalBoundary separately records an actual source boundary
     * edge.
     */
    occurrences: IAutoMovieRecoverySourceHalfedge[];
  };

  /**
   * Every edge-connected two-dimensional source component, including
   * unrepresented or unsupported components.
   */
  components: Array<{
    /**
     * Zero-based ordinal in this record's owning cell, component or control
     * registry; it is not a source coordinate.
     */
    id: number;

    /**
     * Original input triangle ordinals retained as acquisition provenance; they
     * are not generated mesh indices.
     */
    sourceTriangleIds: number[];

    /**
     * Observed relative-sheet incidence counts and independently qualified
     * manifold/orientation invariants; no embedding claim follows.
     */
    topology: IAutoMovieRecoverySourceTopology;

    /**
     * Ordered incidence-node addresses and occurrence traversal words from the
     * same observed boundary walk. Nodes use sourceIncidence.nodes incidenceId,
     * while occurrence endpoints use raw id.
     */
    cycles: Array<{
      /**
       * Source-boundary role: before or after scalar plane, or an actual
       * physical source boundary.
       */
      side: "before" | "after" | "physical" | "mixed";

      /**
       * Whether traversal follows a qualified coherent sheet orientation or
       * remains explicitly unqualified.
       */
      orientation: "coherent" | "unqualified";

      /**
       * Declared observation-port identities participating in this component or
       * diagnostic.
       */
      portIds: string[];

      /**
       * Number of directed halfedge occurrences included in this boundary
       * observation.
       */
      occurrenceCount: number;

      /**
       * Observed boundary-node identities in traversal order; repeated physical
       * positions retain separate incidence when declared.
       */
      nodes: string[];

      /**
       * Directed halfedge occurrences retained in actual source-cell traversal
       * order.
       */
      occurrences: Array<{
        /**
         * Stable identity within the owning chart, boundary or occurrence
         * registry; equal coordinates do not create identity.
         */
        id: string;
        /**
         * Traversal orientation relative to the stored occurrence: +1 forward
         * and -1 backward.
         */
        direction: 1 | -1;
      }>;
    }>;

    /**
     * Topology/admission categories affecting the current observed sheet; an
     * empty list is not a surface-fit certificate.
     */
    issueCodes: string[];
  }>;

  /**
   * Exact cutter provenance and published closed/open curve or
   * unsupported-contour identity for every boundary contour. Occurrence IDs
   * address this slab's private incidence word.
   */
  ports: Array<{
    /**
     * Stable identity within the owning chart, boundary or occurrence registry;
     * equal coordinates do not create identity.
     */
    id: string;

    /**
     * Source-boundary role: before or after scalar plane, or an actual physical
     * source boundary.
     */
    side: "before" | "after";

    /**
     * Signed section-plane coordinate along the registered unit sweep axis, in
     * millimetres.
     */
    coordinateMm: number;

    /**
     * Raw contour ordinal within its physical plane, before fitting or
     * rejection.
     */
    contourIndex: number;

    /**
     * Original closed/open/failed/contact publication outcome, retained
     * independently of this later observation.
     */
    publication: IAutoMovieRecoverySourceLineage["publication"];

    /**
     * Original faces that emitted the observed cut contribution, excluding
     * unrelated endpoint-star neighbours.
     */
    exactSourceTriangleIds: number[];

    /**
     * Observed two-cell components or their query-local ordinals;
     * lower-dimensional contacts do not merge them.
     */
    components: number[];

    /**
     * Directed halfedge occurrences retained in actual source-cell traversal
     * order.
     */
    occurrences: string[];

    /**
     * Closed outcome discriminator; unavailable or ambiguous arms retain
     * diagnostics instead of fabricated successful data.
     */
    status: "unique-component" | "contact-only" | "ambiguous" | "missing";

    /**
     * Contour-identity-only explicitly withholds a pointwise or transverse
     * material-parameter correspondence.
     */
    parameterCorrespondence: "contour-identity-only";
  }>;

  /**
   * Every PL critical source vertex in the closed slab. Qualified means a
   * nonflat regular link, representable brackets and one incident orientable
   * manifold component without recorded issues; this does not certify embedding
   * or physical jets.
   */
  events: Array<{
    /**
     * Stable identity within the owning chart, boundary or occurrence registry;
     * equal coordinates do not create identity.
     */
    id: string;

    /**
     * Signed section-plane coordinate along the registered unit sweep axis, in
     * millimetres.
     */
    coordinateMm: number;

    /**
     * Physical position in the registered millimetre frame; no coordinate
     * matching or source repair is implied.
     */
    pointMm: Readonly<AutoMovieVector3Tuple>;

    /**
     * Connected-component count in the lower link of the critical source
     * vertex.
     */
    lowerComponents: number;

    /**
     * Connected-component count in the upper link of the critical source
     * vertex.
     */
    upperComponents: number;

    /**
     * Whether the observed local incidence meets the owning operation's
     * manifold checks; no embedding claim follows.
     */
    manifold: boolean;

    /** Whether exact scalar ties occur in the critical vertex neighbourhood. */
    flat: boolean;

    /**
     * Whether the owning operation's explicit numerical/topological admission
     * predicates passed; no stronger surface or fidelity claim follows.
     */
    qualified: boolean;

    /**
     * Lower physical sweep coordinate in registered millimetres; paired with
     * the strictly greater afterMm.
     */
    beforeMm: number | null;

    /**
     * Upper physical sweep coordinate in registered millimetres; paired with
     * the strictly smaller beforeMm.
     */
    afterMm: number | null;

    /**
     * Observed two-cell components or their query-local ordinals;
     * lower-dimensional contacts do not merge them.
     */
    components: number[];

    /**
     * Observed admission failures and qualification limits in production order;
     * an empty array adds no extra certificate.
     */
    diagnostics: string[];
  }>;

  /**
   * All reported source-incidence issues; unsupported contacts and
   * unrepresented boundaries remain visible.
   */
  issues: Array<{
    /**
     * Diagnostic category produced by the topology observer; it carries no
     * automatic repair instruction.
     */
    code: string;

    /**
     * Original input triangle ordinals retained as acquisition provenance; they
     * are not generated mesh indices.
     */
    sourceTriangleIds: number[];

    /**
     * Observed two-cell components or their query-local ordinals;
     * lower-dimensional contacts do not merge them.
     */
    components: number[];

    /**
     * Declared observation-port identities participating in this component or
     * diagnostic.
     */
    portIds: string[];
  }>;
}

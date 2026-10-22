import type { IAutoMovieCurve64 } from "@automovie/engine/geometry/curve";

import type { IAutoMovieRecoverySourceLineage } from "./IAutoMovieRecoverySourceLineage";

/**
 * Acquisition-only source incidence for a finite observed slab. Input face ordinals and slab-local occurrence identities bind measured ports and source topology; this record is not engine generation input. Source positions, triangle arrays and normals are absent except for measured critical positions. Critical brackets identify source intervals rather than fitted curves at those brackets.
 *
 * @evidence contracts/common.md#principled-implementation Actual cutter-emitted face provenance binds published curves to the maintained clipped-cell topology owner; copied raw nodes, declared incidence aliases and halfedge occurrences preserve its exact address graph without interpreting IDs. The same scalar chart supplies PL lower/upper-link classification and physical critical brackets.
 * @evidence contracts/common.md#clear-and-simple-design One typed callback record separates source acquisition evidence from source-free curve coefficients and generated skin.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Endpoint-star supersets never become exact port support; unresolved components, failed curves and ambiguous ports remain explicit without source mesh or normal fallback.
 * @evidence contracts/common.md#meaningful-documentation States physical units, input triangle and vertex ordinal spaces, slab-local opaque IDs, raw versus incidence node joins, copied registry ownership, topology qualification and the distinction between measured critical points and cap or transverse-jet authorization.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record owns no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The observer owns copied metadata and measured critical positions; no borrowed source arrays transfer.
 */
export interface IAutoMovieRecoverySlabObservation {
  /** Spatial and scalar coordinate unit for this acquisition record. */
  unit: "mm";

  /** Actual normalized source projection direction, shared with the cutter and PL classifier. */
  axis: IAutoMovieCurve64.Vector;

  /** Maintained conservative boundary-link classifier used for event qualification. */
  criticalPolicy: "boundary-regular-path-v1";

  /** Signed lower and upper bounds along the fixed observation's normalized axis, millimetres. */
  boundsMm: [number, number];

  /** Copied source-address registries from this slab's actual clipped-cell observation. IDs are opaque and local to this slab; they must not be parsed or reused across observations. This metadata supplies address joins, not curve phase, surface coefficients or generation geometry. */
  sourceIncidence: {
    /** Actual declared source-incidence policy used for this observation. */
    incidence: "raw" | "canonical";

    /** All face addresses in this record index the supplied triangles array. A selected mesh retains its selected local ordinals; the caller owns any map to an external original mesh. */
    triangleOrdinalSpace: "input-triangles";

    /** Node vertex memberships index the supplied verticesMm array, independently of any face selection or external vertex numbering. */
    vertexOrdinalSpace: "input-vertices";

    /** Every observed raw node, including contacts and aliases. Scalar values are signed millimetres on axis; memberships retain original input vertex addresses without coordinates. */
    nodes: Array<{
      /** Raw endpoint address referenced by occurrence from/to. */
      id: string;

      /** Declared incidence address referenced by cycle nodes; multiple raw nodes may share it. */
      incidenceId: string;

      /** Original input vertex memberships: one source vertex or the two endpoints of a clipped source edge. */
      vertices: number[];

      /** Actual source projection or clipping-plane coordinate, millimetres. */
      scalar: number;
    }>;

    /** Existing raw-node to incidence-address aliases, copied without merging their memberships. Unlisted raw nodes have identical raw and incidence addresses. */
    aliases: Array<{
      /** Raw node address in nodes. */
      rawNode: string;

      /** Shared declared incidence address of that raw node. */
      incidenceId: string;
    }>;

    /** Every observed two-cell halfedge occurrence, including interior edges. Cycle and port occurrence IDs join here. Side names describe scalar strata; physicalBoundary separately records an actual source boundary edge. */
    occurrences: Array<{
      /** Opaque occurrence identity owned by this slab. */
      id: string;

      /** Opaque numeric clipped-cell address owned by this slab, not a triangle ordinal. */
      cell: number;

      /** Face ordinal in the supplied triangles array. */
      face: number;

      /** Raw starting node address in nodes. */
      from: string;

      /** Raw ending node address in nodes. */
      to: string;

      /** Opaque declared edge-incidence identity; equal addresses retain separate occurrences. */
      edge: string;

      /** Actual scalar-boundary classification; physical alone does not establish a source boundary. */
      side: "before" | "after" | "physical";

      /** Whether the declared source edge has exactly one original face occurrence. */
      physicalBoundary: boolean;

      /** Owning component ID in components. */
      component: number;
    }>;
  };

  /** Every edge-connected two-dimensional source component, including unrepresented or unsupported components. */
  components: Array<{
    id: number;
    sourceTriangleIds: number[];
    topology: {
      vertices: number;
      edges: number;
      faces: number;
      euler: number | null;
      manifold: boolean;
      orientable: boolean | null;
      inputOrientationConsistent: boolean;
      boundaryCycles: number;
      genus: number | null;
    };

    /** Ordered incidence-node addresses and occurrence traversal words from the same observed boundary walk. Nodes use sourceIncidence.nodes incidenceId, while occurrence endpoints use raw id. */
    cycles: Array<{
      side: "before" | "after" | "physical" | "mixed";
      orientation: "coherent" | "unqualified";
      portIds: string[];
      occurrenceCount: number;
      nodes: string[];
      occurrences: Array<{ id: string; direction: 1 | -1 }>;
    }>;

    issueCodes: string[];
  }>;

  /** Exact cutter provenance and published closed/open curve or unsupported-contour identity for every boundary contour. Occurrence IDs address this slab's private incidence word. */
  ports: Array<{
    id: string;
    side: "before" | "after";
    coordinateMm: number;
    contourIndex: number;
    publication: IAutoMovieRecoverySourceLineage["publication"];
    exactSourceTriangleIds: number[];
    components: number[];
    occurrences: string[];
    status: "unique-component" | "contact-only" | "ambiguous" | "missing";
    parameterCorrespondence: "contour-identity-only";
  }>;

  /** Every PL critical source vertex in the closed slab. Qualified means a nonflat regular link, representable brackets and one incident orientable manifold component without recorded issues; this does not certify embedding or physical jets. */
  events: Array<{
    id: string;
    coordinateMm: number;
    pointMm: IAutoMovieCurve64.Vector;
    lowerComponents: number;
    upperComponents: number;
    manifold: boolean;
    flat: boolean;
    qualified: boolean;
    beforeMm: number | null;
    afterMm: number | null;
    components: number[];
    diagnostics: string[];
  }>;

  /** All reported source-incidence issues; unsupported contacts and unrepresented boundaries remain visible. */
  issues: Array<{
    code: string;
    sourceTriangleIds: number[];
    components: number[];
    portIds: string[];
  }>;
}

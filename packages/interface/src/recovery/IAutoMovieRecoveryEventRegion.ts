import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieRecoverySourceCell } from "./IAutoMovieRecoverySourceCell";
import type { IAutoMovieRecoverySourceCellNode } from "./IAutoMovieRecoverySourceCellNode";
import type { IAutoMovieRecoverySourceComponent } from "./IAutoMovieRecoverySourceComponent";
import type { IAutoMovieRecoverySourceHalfedge } from "./IAutoMovieRecoverySourceHalfedge";
import type { IAutoMovieRecoverySourcePort } from "./IAutoMovieRecoverySourcePort";
import type { IAutoMovieRecoverySourcePortReference } from "./IAutoMovieRecoverySourcePortReference";
import type { IAutoMovieRecoverySourceTopologyIssue } from "./IAutoMovieRecoverySourceTopologyIssue";

/**
 * Prepare private scalar-clipped source-cell ownership and boundary incidence
 * observations. Every query supplies all faces with max(height)>=before and
 * min(height)<=after, in original face order. The implicit cell is that face's
 * barycentric domain intersected with the closed scalar interval; no source
 * triangle array or generated mesh is returned. Source and returned private
 * addresses must be discarded before engine publication. Original source edges
 * share declared incidence; cut edges remain face occurrences, so coincident or
 * parallel cut edges are not welded. Raw and canonical incidence are explicit
 * alternatives, not assumed equivalent. Plane strata require one external owner
 * when adjacent slabs are combined. Connectivity/topology never establishes a
 * regular or event chart: every component remains unclassified, with all
 * unsupported evidence retained.
 */

export namespace IAutoMovieRecoveryEventRegion {
  /**
   * Prepare private scalar-clipped source-cell ownership and boundary incidence
   * observations. Every query supplies all faces with max(height)>=before and
   * min(height)<=after, in original face order. The implicit cell is that
   * face's barycentric domain intersected with the closed scalar interval; no
   * source triangle array or generated mesh is returned. Source and returned
   * private addresses must be discarded before engine publication. Original
   * source edges share declared incidence; cut edges remain face occurrences,
   * so coincident or parallel cut edges are not welded. Raw and canonical
   * incidence are explicit alternatives, not assumed equivalent. Plane strata
   * require one external owner when adjacent slabs are combined.
   * Connectivity/topology never establishes a regular or event chart: every
   * component remains unclassified, with all unsupported evidence retained.
   */

  export type Operation = (
    source: IAutoMovieRecoveryEventRegion.Source,
  ) => (
    query: IAutoMovieRecoveryEventRegion.Query,
  ) => IAutoMovieRecoveryEventRegion.Result;

  /**
   * Source within recovery event region. Borrowed physical positions in the
   * registered millimetre frame; indices in triangles address this array.
   */
  export interface Source {
    /**
     * Borrowed physical positions in the registered millimetre frame; indices
     * in triangles address this array.
     */
    verticesMm: readonly Readonly<AutoMovieVector3Tuple>[];

    /**
     * Oriented triangle vertex-index triples addressing the paired position
     * array; indices are not control IDs.
     */
    triangles: readonly IAutoMovieRecoveryEventRegion.Triangle[];

    /**
     * One in-range canonical connectivity index per original vertex; this does
     * not move source coordinates.
     */
    canon: Int32Array;

    /**
     * Finite scalar projections aligned with source vertices, in the same units
     * as query levels.
     */
    heights: readonly number[];

    /**
     * Selects raw source addresses or caller-declared canonical connectivity;
     * equal coordinates alone do not select an equivalence.
     */
    incidence: "raw" | "canonical";
  }

  /**
   * Query within recovery event region. Lower physical sweep coordinate in
   * registered millimetres; paired with the strictly greater afterMm.
   */
  export interface Query {
    /**
     * Lower physical sweep coordinate in registered millimetres; paired with
     * the strictly greater afterMm.
     */
    beforeMm: number;

    /**
     * Upper physical sweep coordinate in registered millimetres; paired with
     * the strictly smaller beforeMm.
     */
    afterMm: number;

    /**
     * Strictly increasing original face indices covering the operation's
     * complete scalar overlap interval; omission, where allowed, scans all
     * faces.
     */
    candidates: readonly number[];

    /**
     * Declared boundary observations and their component membership; ambiguous
     * or missing membership remains explicit.
     */
    ports: readonly IAutoMovieRecoverySourcePort[];
  }

  /**
   * Returned coefficient or observation state from RecoveryEventRegion. Every
   * observed source-topology or port-membership failure, retained without
   * repairing source incidence.
   */
  export interface Result {
    /**
     * Selects raw source addresses or caller-declared canonical connectivity;
     * equal coordinates alone do not select an equivalence.
     */
    incidence: IAutoMovieRecoveryEventRegion.Source["incidence"];

    /** Closed scalar query bounds [before,after] in registered millimetres. */
    boundsMm: [number, number];

    /**
     * Candidate inclusion is the caller's closed-overlap premise, not
     * independently certified here.
     */
    coverage: {
      /**
       * Number of caller-supplied face candidates visited by this
       * closed-interval query.
       */
      candidateFaces: number;

      /**
       * Supplied candidates with no cell in the requested closed scalar
       * interval.
       */
      outsideCandidates: number;

      /**
       * Caller-premise means the observer does not scan omitted faces to
       * certify candidate completeness.
       */
      completeness: "caller-premise";
    };

    /**
     * Observed boundary-node identities in traversal order; repeated physical
     * positions retain separate incidence when declared.
     */
    nodes: IAutoMovieRecoverySourceCellNode[];

    /**
     * Explicit original-to-canonical incidence aliases; no proximity matching
     * is inferred.
     */
    aliases: {
      /**
       * Original observed node identity before applying the selected incidence
       * equivalence.
       */
      rawNode: string;
      /**
       * Declared connectivity identity, independent of physical coordinate
       * equality.
       */
      incidenceId: string;
    }[];

    /**
     * Observed source cells in query-local index order; source-face addresses
     * remain acquisition metadata.
     */
    cells: IAutoMovieRecoverySourceCell[];

    /**
     * Directed halfedge occurrences retained in actual source-cell traversal
     * order.
     */
    occurrences: IAutoMovieRecoverySourceHalfedge[];

    /**
     * Observed two-cell components or their query-local ordinals;
     * lower-dimensional contacts do not merge them.
     */
    components: IAutoMovieRecoverySourceComponent[];

    /**
     * Lower-dimensional source cells and their incident two-cell components,
     * retained without inventing a cap.
     */
    contacts: {
      /** Query-local index into the observed cells array. */
      cell: number;
      /**
       * Component ordinals meeting this lower-dimensional contact; contact does
       * not merge their two-cell sheets.
       */
      touchingComponents: number[];
    }[];

    /**
     * Declared boundary observations and their component membership; ambiguous
     * or missing membership remains explicit.
     */
    ports: {
      /**
       * Stable identity within the owning chart, boundary or occurrence
       * registry; equal coordinates do not create identity.
       */
      id: string;

      /**
       * Saved observation address for this port; the discriminant separates
       * closed/open curves, contacts and named boundaries.
       */
      reference: IAutoMovieRecoverySourcePortReference;

      /**
       * Observed source cells in query-local index order; source-face addresses
       * remain acquisition metadata.
       */
      cells: number[];

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
    }[];

    /**
     * Every observed source-topology or port-membership failure, retained
     * without repairing source incidence.
     */
    issues: IAutoMovieRecoverySourceTopologyIssue[];
  }

  /**
   * Triangle within recovery event region. Its referenced contract retains the
   * same units, ordering and absence semantics.
   */
  export type Triangle = readonly [number, number, number];
}

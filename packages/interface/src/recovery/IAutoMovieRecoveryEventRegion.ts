import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieRecoverySourceCell } from "./IAutoMovieRecoverySourceCell";
import type { IAutoMovieRecoverySourceCellNode } from "./IAutoMovieRecoverySourceCellNode";
import type { IAutoMovieRecoverySourceComponent } from "./IAutoMovieRecoverySourceComponent";
import type { IAutoMovieRecoverySourceHalfedge } from "./IAutoMovieRecoverySourceHalfedge";
import type { IAutoMovieRecoverySourcePort } from "./IAutoMovieRecoverySourcePort";
import type { IAutoMovieRecoverySourcePortReference } from "./IAutoMovieRecoverySourcePortReference";
import type { IAutoMovieRecoverySourceTopologyIssue } from "./IAutoMovieRecoverySourceTopologyIssue";

/**
 * Prepare source geometry once and query clipped cells and boundary observation
 * membership.
 */

export namespace IAutoMovieRecoveryEventRegion {
  /**
   * Prepare the supplied registered source and incidence mode, then query its
   * intersection with a closed scalar slab. Supply every face meeting that
   * interval in original ordinal order. Return cells, component topology,
   * contacts and port ownership.
   */

  export type Operation = (
    source: IAutoMovieRecoveryEventRegion.Source,
  ) => (
    query: IAutoMovieRecoveryEventRegion.Query,
  ) => IAutoMovieRecoveryEventRegion.Result;

  /**
   * Borrowed registered source arrays and explicit incidence equivalence for
   * repeated region queries.
   */
  export interface Source {
    /** Original registered Cartesian vertices in millimetres. */
    verticesMm: readonly Readonly<AutoMovieVector3Tuple>[];

    /** Original oriented triangle vertex triples in source face order. */
    triangles: readonly IAutoMovieRecoveryEventRegion.Triangle[];

    /** One in-range idempotent canonical address per original source vertex. */
    canon: Int32Array;

    /**
     * Finite signed scalar coordinates in millimetres, aligned with the
     * original vertices.
     */
    heights: readonly number[];

    /**
     * Connectivity rule selecting original or exact-equivalent canonical vertex
     * addresses.
     */
    incidence: "raw" | "canonical";
  }

  /**
   * One closed physical scalar interval and the source and port populations to
   * observe.
   */
  export interface Query {
    /** Lower signed scalar plane in millimetres. */
    beforeMm: number;

    /** Upper signed scalar plane in millimetres, strictly greater than beforeMm. */
    afterMm: number;

    /**
     * Original face ordinals in strictly increasing order. Include all faces
     * meeting the closed scalar interval.
     */
    candidates: readonly number[];

    /**
     * Caller-defined boundary observations with exact source support and named
     * typed references.
     */
    ports: readonly IAutoMovieRecoverySourcePort[];
  }

  /**
   * Clipped source incidence, contact, topology and port evidence for one
   * admitted physical query.
   */
  export interface Result {
    /** Raw or canonical connectivity policy used to build this result. */
    incidence: IAutoMovieRecoveryEventRegion.Source["incidence"];

    /** Lower and upper signed scalar bounds in millimetres. */
    boundsMm: [number, number];

    /**
     * Accounting for supplied candidates and those completely outside the
     * closed clip.
     */
    coverage: {
      /** Number of original face ordinals supplied in this query. */
      candidateFaces: number;

      /** Supplied candidates whose closed scalar clip was empty. */
      outsideCandidates: number;

      /**
       * Literal caller premise acknowledging that candidate completeness is
       * externally supplied.
       */
      completeness: "caller-premise";
    };

    /** Distinct raw source nodes encountered while clipping nonempty cells. */
    nodes: IAutoMovieRecoverySourceCellNode[];

    /** Raw node addresses whose selected incidence identity differs. */
    aliases: {
      /** Raw clipping node ID with a different joining identity. */
      rawNode: string;
      /** Incidence key used in component processing for that raw node. */
      incidenceId: string;
    }[];

    /**
     * Retained nonempty clipped cells, with original face and contact
     * dimension.
     */
    cells: IAutoMovieRecoverySourceCell[];

    /** Directed source-relative halfedges from dimension-two clipped cells. */
    occurrences: IAutoMovieRecoverySourceHalfedge[];

    /**
     * Edge-connected dimension-two cell populations and their independent
     * topology evidence.
     */
    components: IAutoMovieRecoverySourceComponent[];

    /** Lower-dimensional clipped cells and the observed components they touch. */
    contacts: {
      /** ID of the lower-dimensional clipped contact cell. */
      cell: number;
      /** Dimension-two component IDs touched by the contact's incidence nodes. */
      touchingComponents: number[];
    }[];

    /**
     * Named boundary references with clipped cell, component and occurrence
     * membership and explicit status.
     */
    ports: {
      /** Original caller-defined port name. */
      id: string;

      /** Caller-supplied typed observable address for the port. */
      reference: IAutoMovieRecoverySourcePortReference;

      /** Retained clipped-cell IDs reached by source face ownership. */
      cells: number[];

      /** Dimension-two component IDs incident to those retained cells. */
      components: number[];

      /** Exposed source occurrence IDs admitted by this port role. */
      occurrences: string[];

      /** Unique, contact-only, ambiguous or missing source membership. */
      status: "unique-component" | "contact-only" | "ambiguous" | "missing";
    }[];

    /**
     * Source topology and port problems retained with implicated original and
     * result-local IDs.
     */
    issues: IAutoMovieRecoverySourceTopologyIssue[];
  }

  /** One oriented original source triangle in vertex population order. */
  export type Triangle = readonly [number, number, number];
}

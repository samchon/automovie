import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieRecoveryAtlasObservationInput } from "./IAutoMovieRecoveryAtlasObservationInput";
import type { IAutoMovieRecoveryChartInventory } from "./IAutoMovieRecoveryChartInventory";
import type { IAutoMovieRecoveryEventRegion } from "./IAutoMovieRecoveryEventRegion";
import type { IAutoMovieRecoveryPendingChartObservation } from "./IAutoMovieRecoveryPendingChartObservation";
import type { IAutoMovieRecoverySourceComponent } from "./IAutoMovieRecoverySourceComponent";

/**
 * Prepare an annular, natural-side or general disk chart without changing its
 * declared correspondence.
 */

export namespace IAutoMovieRecoveryAtlasObservationChart {
  /**
   * Prepare an annular, natural-side or general disk chart without changing its
   * declared correspondence.
   */

  export type Operation = (context: {
    /**
     * Directed halfedge occurrences retained in actual source-cell traversal
     * order.
     */
    occurrences: Map<
      string,
      IAutoMovieRecoveryEventRegion.Result["occurrences"][number]
    >;

    /**
     * Borrowed complete admitted observation request shared by this phase; the
     * phase does not change its source selection.
     */
    input: IAutoMovieRecoveryAtlasObservationInput;

    /**
     * Caller-assigned stable semantic identity retained in generated
     * coefficient and observation records.
     */
    name: string;

    /**
     * Chart-local physical positions in registered millimetres, aligned with
     * vertexIds and triangle indices.
     */
    positions: Readonly<AutoMovieVector3Tuple>[];

    /**
     * Oriented triangle vertex-index triples addressing the paired position
     * array; indices are not control IDs.
     */
    triangles: [number, number, number][];

    /** Observed vertex identity at each current chart position index. */
    vertexIds: string[];

    /** Observed vertex identity to its chart-local position index. */
    slots: Map<string, number>;

    /**
     * One observed source-cell component with independent topology
     * qualification.
     */
    component: IAutoMovieRecoverySourceComponent;

    /**
     * Ordinal of the adjacent saved-plane interval in the complete observation
     * sequence.
     */
    interval: number;

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
     * Prepared chart jobs awaiting common boundary fitting; their outcome
     * arrays are shared with the observation ledger.
     */
    pending: IAutoMovieRecoveryPendingChartObservation[];

    /**
     * Unfitted chart population measurements retained independently of later
     * fitting success.
     */
    inventory: IAutoMovieRecoveryChartInventory[];

    /**
     * Caller-owned mutable diagnostic ledger entries; these are metadata and
     * never interpreted as generated geometry.
     */
    outcomes: object[];

    /**
     * Whether the observed component has the qualified two-boundary annular
     * topology required by this path.
     */
    annular: boolean;

    /**
     * Whether the component uses the general single-boundary disk chart
     * preparation.
     */
    generalDisk: boolean;

    /**
     * Boundary runs in observed traversal order, with before/after/physical
     * roles kept distinct.
     */
    ordered: {
      /**
       * Source-boundary role: before or after scalar plane, or an actual
       * physical source boundary.
       */
      side: "before" | "after" | "physical";
      /**
       * Observed boundary-node identities in traversal order; repeated physical
       * positions retain separate incidence when declared.
       */
      nodes: string[];
    }[];
  }) => void;
}

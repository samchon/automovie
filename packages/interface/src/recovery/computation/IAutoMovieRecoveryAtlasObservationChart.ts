import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieRecoveryAtlasObservationState } from "./IAutoMovieRecoveryAtlasObservationState";

/**
 * Prepare an annular, natural-side or general disk chart without changing its declared correspondence.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Directed halfedge occurrences retained in actual source-cell traversal order. Borrowed complete admitted observation request shared by this phase; the phase does not change its source selection.
 * @evidence contracts/development/design.md#principled-representation Borrowed complete admitted observation request shared by this phase; the phase does not change its source selection.
 * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryAtlasObservationChart share IAutoMovieRecoveryAtlasObservationChart's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Directed halfedge occurrences retained in actual source-cell traversal order.
 */

export namespace IAutoMovieRecoveryAtlasObservationChart {
  /**
   * Prepare an annular, natural-side or general disk chart without changing its declared correspondence.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Directed halfedge occurrences retained in actual source-cell traversal order. Borrowed complete admitted observation request shared by this phase; the phase does not change its source selection.
   * @evidence contracts/development/design.md#principled-representation Borrowed complete admitted observation request shared by this phase; the phase does not change its source selection.
   * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryAtlasObservationChart share IAutoMovieRecoveryAtlasObservationChart's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Directed halfedge occurrences retained in actual source-cell traversal order.
   */

  export type Operation = (context: {
    /** Directed halfedge occurrences retained in actual source-cell traversal order. */
    occurrences: Map<
      string,
      IAutoMovieRecoveryAtlasObservationState["Observed"]["occurrences"][number]
    >;

    /** Borrowed complete admitted observation request shared by this phase; the phase does not change its source selection. */
    input: IAutoMovieRecoveryAtlasObservationState["Input"];

    /** Caller-assigned stable semantic identity retained in generated coefficient and observation records. */
    name: string;

    /** Chart-local physical positions in registered millimetres, aligned with vertexIds and triangle indices. */
    positions: Readonly<AutoMovieVector3Tuple>[];

    /** Oriented triangle vertex-index triples addressing the paired position array; indices are not control IDs. */
    triangles: [number, number, number][];

    /** Observed vertex identity at each current chart position index. */
    vertexIds: string[];

    /** Observed vertex identity to its chart-local position index. */
    slots: Map<string, number>;

    /** One observed source-cell component with independent topology qualification. */
    component: IAutoMovieRecoveryAtlasObservationState["Component"];

    /** Ordinal of the adjacent saved-plane interval in the complete observation sequence. */
    interval: number;

    /** Lower physical sweep coordinate in registered millimetres; paired with the strictly greater afterMm. */
    beforeMm: number;

    /** Upper physical sweep coordinate in registered millimetres; paired with the strictly smaller beforeMm. */
    afterMm: number;

    /** Prepared chart jobs awaiting common boundary fitting; their outcome arrays are shared with the observation ledger. */
    pending: IAutoMovieRecoveryAtlasObservationState["Pending"][];

    /** Unfitted chart population measurements retained independently of later fitting success. */
    inventory: IAutoMovieRecoveryAtlasObservationState["Inventory"][];

    /** Caller-owned mutable diagnostic ledger entries; these are metadata and never interpreted as generated geometry. */
    outcomes: object[];

    /** Whether the observed component has the qualified two-boundary annular topology required by this path. */
    annular: boolean;

    /** Whether the component uses the general single-boundary disk chart preparation. */
    generalDisk: boolean;

    /** Boundary runs in observed traversal order, with before/after/physical roles kept distinct. */
    ordered: {
      /** Source-boundary role: before or after scalar plane, or an actual physical source boundary. */
      side: "before" | "after" | "physical";
      /** Observed boundary-node identities in traversal order; repeated physical positions retain separate incidence when declared. */
      nodes: string[];
    }[];
  }) => void;
}

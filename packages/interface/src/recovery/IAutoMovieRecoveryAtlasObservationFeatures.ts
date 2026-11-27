import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieRecoveryAtlasObservationInput } from "./IAutoMovieRecoveryAtlasObservationInput";
import type { IAutoMovieRecoveryChartInventory } from "./IAutoMovieRecoveryChartInventory";
import type { IAutoMovieRecoveryPendingChartObservation } from "./IAutoMovieRecoveryPendingChartObservation";
import type { IAutoMovieRecoverySourceComponent } from "./IAutoMovieRecoverySourceComponent";
import type { IAutoMovieRecoverySourceCrease } from "./IAutoMovieRecoverySourceCrease";

/** Register feature-prepared charts and their original shared outcome records. */

export namespace IAutoMovieRecoveryAtlasObservationFeatures {
  /** Register feature-prepared charts and their original shared outcome records. */

  export type Operation = (context: {
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
     * One original source-face ordinal per current chart triangle, preserving
     * subdivision provenance.
     */
    triangleSourceFaces: number[];

    /**
     * Original source crease edges admitted by the declared angular policy,
     * retaining both incident face owners.
     */
    featureEdges: IAutoMovieRecoverySourceCrease[];

    /**
     * Stable identities of selected source components that failed observation
     * or chart preparation.
     */
    failedSelectedComponents: Set<string>;

    /**
     * Synchronous accounting callback that records one unsupported component;
     * it supplies no replacement geometry.
     */
    incrementUnsupported: () => void;
  }) => void;
}

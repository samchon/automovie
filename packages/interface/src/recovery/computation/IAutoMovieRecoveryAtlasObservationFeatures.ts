import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieRecoveryAtlasObservationState } from "./IAutoMovieRecoveryAtlasObservationState";

/**
 * Register feature-prepared charts and their original shared outcome records.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Borrowed complete admitted observation request shared by this phase; the phase does not change its source selection. Caller-assigned stable semantic identity retained in generated coefficient and observation records.
 * @evidence contracts/development/design.md#principled-representation Borrowed complete admitted observation request shared by this phase; the phase does not change its source selection.
 * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryAtlasObservationFeatures share IAutoMovieRecoveryAtlasObservationFeatures's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Borrowed complete admitted observation request shared by this phase; the phase does not change its source selection.
 */

export namespace IAutoMovieRecoveryAtlasObservationFeatures {
  /**
   * Register feature-prepared charts and their original shared outcome records.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Borrowed complete admitted observation request shared by this phase; the phase does not change its source selection. Caller-assigned stable semantic identity retained in generated coefficient and observation records.
   * @evidence contracts/development/design.md#principled-representation Borrowed complete admitted observation request shared by this phase; the phase does not change its source selection.
   * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryAtlasObservationFeatures share IAutoMovieRecoveryAtlasObservationFeatures's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Borrowed complete admitted observation request shared by this phase; the phase does not change its source selection.
   */

  export type Operation = (context: {
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

    /** One original source-face ordinal per current chart triangle, preserving subdivision provenance. */
    triangleSourceFaces: number[];

    /** Original source crease edges admitted by the declared angular policy, retaining both incident face owners. */
    featureEdges: IAutoMovieRecoveryAtlasObservationState["Feature"][];

    /** Stable identities of selected source components that failed observation or chart preparation. */
    failedSelectedComponents: Set<string>;

    /** Synchronous accounting callback that records one unsupported component; it supplies no replacement geometry. */
    incrementUnsupported: () => void;
  }) => void;
}

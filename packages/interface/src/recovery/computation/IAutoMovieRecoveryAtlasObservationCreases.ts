import type { IAutoMovieRecoveryAtlasObservationState } from "./IAutoMovieRecoveryAtlasObservationState";

/**
 * Observe original component crease edges with the existing oriented source normals.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Borrowed complete admitted observation request shared by this phase; the phase does not change its source selection. Query-local source-cell and topology observation, borrowed unchanged for this chart pass.
 * @evidence contracts/development/design.md#principled-representation Borrowed complete admitted observation request shared by this phase; the phase does not change its source selection.
 * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryAtlasObservationCreases, observeAutoMovieRecoveryAtlas share IAutoMovieRecoveryAtlasObservationCreases's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Borrowed complete admitted observation request shared by this phase; the phase does not change its source selection.
 */

export namespace IAutoMovieRecoveryAtlasObservationCreases {
  /**
   * Observe original component crease edges with the existing oriented source normals.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Borrowed complete admitted observation request shared by this phase; the phase does not change its source selection. Query-local source-cell and topology observation, borrowed unchanged for this chart pass.
   * @evidence contracts/development/design.md#principled-representation Borrowed complete admitted observation request shared by this phase; the phase does not change its source selection.
   * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryAtlasObservationCreases, observeAutoMovieRecoveryAtlas share IAutoMovieRecoveryAtlasObservationCreases's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Borrowed complete admitted observation request shared by this phase; the phase does not change its source selection.
   */

  export type Operation = (context: {
    /** Borrowed complete admitted observation request shared by this phase; the phase does not change its source selection. */
    input: IAutoMovieRecoveryAtlasObservationState["Input"];

    /** Query-local source-cell and topology observation, borrowed unchanged for this chart pass. */
    observed: IAutoMovieRecoveryAtlasObservationState["Observed"];

    /** One observed source-cell component with independent topology qualification. */
    component: IAutoMovieRecoveryAtlasObservationState["Component"];

    /** Observed original face-normal directions used only for acquisition qualification, never generated-surface fallback. */
    sourceNormals: number[][];

    /** Original node identity to declared incidence identity for the selected source chart. */
    byRaw: Map<string, string>;

    /** Records a source qualification failure in the caller-owned diagnostics; it supplies no geometry. */
    mark: (value: string) => void;

    /** Actual termination or qualification reason; null, where allowed, means no local failure was recorded. */
    reason: string | null;
  }) => {
    /** Original face ordinals touched by admitted or unsupported crease observations. */
    creaseFaces: number[];
    /** Original source crease edges admitted by the declared angular policy, retaining both incident face owners. */
    featureEdges: IAutoMovieRecoveryAtlasObservationState["Feature"][];
  };
}

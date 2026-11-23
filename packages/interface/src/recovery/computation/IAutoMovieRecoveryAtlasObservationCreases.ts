import type { IAutoMovieRecoveryAtlasObservationInput } from "../observation/IAutoMovieRecoveryAtlasObservationInput";
import type { IAutoMovieRecoveryEventRegion } from "./IAutoMovieRecoveryEventRegion";
import type { IAutoMovieRecoverySourceComponent } from "./IAutoMovieRecoverySourceComponent";
import type { IAutoMovieRecoverySourceCrease } from "./IAutoMovieRecoverySourceCrease";

/**
 * Observe original component crease edges with the existing oriented source
 * normals.
 */

export namespace IAutoMovieRecoveryAtlasObservationCreases {
  /**
   * Observe original component crease edges with the existing oriented source
   * normals.
   */

  export type Operation = (context: {
    /**
     * Borrowed complete admitted observation request shared by this phase; the
     * phase does not change its source selection.
     */
    input: IAutoMovieRecoveryAtlasObservationInput;

    /**
     * Query-local source-cell and topology observation, borrowed unchanged for
     * this chart pass.
     */
    observed: IAutoMovieRecoveryEventRegion.Result;

    /**
     * One observed source-cell component with independent topology
     * qualification.
     */
    component: IAutoMovieRecoverySourceComponent;

    /**
     * Observed original face-normal directions used only for acquisition
     * qualification, never generated-surface fallback.
     */
    sourceNormals: number[][];

    /**
     * Original node identity to declared incidence identity for the selected
     * source chart.
     */
    byRaw: Map<string, string>;

    /**
     * Records a source qualification failure in the caller-owned diagnostics;
     * it supplies no geometry.
     */
    mark: (value: string) => void;

    /**
     * Actual termination or qualification reason; null, where allowed, means no
     * local failure was recorded.
     */
    reason: string | null;
  }) => {
    /**
     * Original face ordinals touched by admitted or unsupported crease
     * observations.
     */
    creaseFaces: number[];
    /**
     * Original source crease edges admitted by the declared angular policy,
     * retaining both incident face owners.
     */
    featureEdges: IAutoMovieRecoverySourceCrease[];
  };
}

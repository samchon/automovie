import type { IAutoMovieBicubicAtlasGeometry } from "../../model/IAutoMovieBicubicAtlasGeometry";
import type { IAutoMovieRecoveryAtlasObservationInput } from "../observation/IAutoMovieRecoveryAtlasObservationInput";
import type { IAutoMovieRecoveryAtlasObservationOperation } from "../observation/IAutoMovieRecoveryAtlasObservationOperation";
import type { IAutoMovieRecoveryChartAssembly } from "./IAutoMovieRecoveryChartAssembly";
import type { IAutoMovieRecoveryChartBoundary } from "./IAutoMovieRecoveryChartBoundary";
import type { IAutoMovieRecoveryChartInventory } from "./IAutoMovieRecoveryChartInventory";
import type { IAutoMovieRecoveryPendingChartObservation } from "./IAutoMovieRecoveryPendingChartObservation";
import type { IAutoMovieRecoveryScalarIntervalsSelectionOperation } from "./IAutoMovieRecoveryScalarIntervalsSelectionOperation";

/**
 * Fit the completely registered selected domain and publish its canonical
 * assembly and coverage.
 */

export namespace IAutoMovieRecoveryAtlasObservationPublish {
  /**
   * Fit the completely registered selected domain and publish its canonical
   * assembly and coverage.
   */

  export type Operation = (context: {
    /**
     * Borrowed complete admitted observation request shared by this phase; the
     * phase does not change its source selection.
     */
    input: IAutoMovieRecoveryAtlasObservationInput;

    /**
     * Prepared chart jobs awaiting common boundary fitting; their outcome
     * arrays are shared with the observation ledger.
     */
    pending: IAutoMovieRecoveryPendingChartObservation[];

    /**
     * One pass-owned boundary registry reused by all charts sharing the same
     * declared incidence words.
     */
    boundaryOwner: ReturnType<IAutoMovieRecoveryChartBoundary.Operation>;

    /**
     * Admitted fitted chart coefficients prepared for the final common-atlas
     * assembly.
     */
    fittedCharts: Parameters<IAutoMovieRecoveryChartAssembly.Operation>[0][number][];

    /**
     * Shared coefficient registry or its declared population, addressed by
     * patch control IDs.
     */
    controls: IAutoMovieBicubicAtlasGeometry["controls"];

    /**
     * Bicubic coefficient patches indexed by the shared control registry, with
     * u varying fastest within each v row.
     */
    patches: IAutoMovieBicubicAtlasGeometry["patches"];

    /**
     * Prepared or fitted source charts in deterministic observation order,
     * including each independently retained feature piece.
     */
    charts: object[];

    /**
     * Acquisition-only diagnostic records retained outside the published
     * source-free coefficient geometry.
     */
    privateLedger: object[];

    /**
     * Original faces represented by admitted chart observations; tracked
     * separately from encountered faces.
     */
    representedFaces: Set<number>;

    /**
     * Original faces encountered in the requested observation population,
     * including refused components.
     */
    encounteredFaces: Set<number>;

    /**
     * Stable identities of selected source components that failed observation
     * or chart preparation.
     */
    failedSelectedComponents: Set<string>;

    /**
     * Observed original face-normal directions used only for acquisition
     * qualification, never generated-surface fallback.
     */
    sourceNormals: number[][];

    /**
     * Unfitted chart population measurements retained independently of later
     * fitting success.
     */
    inventory: IAutoMovieRecoveryChartInventory[];

    /**
     * Complete source-plane ordering used for deterministic scalar-interval
     * selection.
     */
    order: readonly number[];

    /**
     * Admitted scalar interval selection, including explicit excluded-window
     * accounting.
     */
    selection: ReturnType<IAutoMovieRecoveryScalarIntervalsSelectionOperation.Operation>;

    /**
     * Original scalar interval ordinals actually visited in this observation
     * pass.
     */
    visitedIntervalIds: number[];

    /** Number of requested scalar intervals actually visited. */
    visitedIntervals: number;

    /**
     * Number of source components actually visited across the selected
     * intervals.
     */
    visitedComponents: number;

    /**
     * Synchronous accounting callback that records one unsupported component;
     * it supplies no replacement geometry.
     */
    incrementUnsupported: () => void;

    /**
     * Returns the current unsupported-component count without consuming or
     * resetting it.
     */
    unsupportedCount: () => number;

    /**
     * Synchronous observation callback; caller-owned work and retained copies
     * are outside the numerical operation's resource bound.
     */
    observe: ((record: object) => void) | undefined;
  }) => ReturnType<IAutoMovieRecoveryAtlasObservationOperation.Operation>;
}

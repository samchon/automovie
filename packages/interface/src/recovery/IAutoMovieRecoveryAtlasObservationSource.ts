import type { IAutoMovieRecoveryAtlasObservationInput } from "./IAutoMovieRecoveryAtlasObservationInput";
import type { IAutoMovieRecoveryEventRegion } from "./IAutoMovieRecoveryEventRegion";
import type { IAutoMovieRecoveryScalarIndex } from "./IAutoMovieRecoveryScalarIndex";
import type { IAutoMovieRecoveryScalarIntervalsSelectionOperation } from "./IAutoMovieRecoveryScalarIntervalsSelectionOperation";

/** Admit the immutable source and prepare the selected scalar interval index. */

export namespace IAutoMovieRecoveryAtlasObservationSource {
  /** Admit the immutable source and prepare the selected scalar interval index. */

  export type Operation = (input: IAutoMovieRecoveryAtlasObservationInput) => {
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
     * Finite scalar projections aligned with source vertices, in the same units
     * as query levels.
     */
    heights: number[];

    /**
     * Prepared source-cell query closure retaining the admitted source and
     * selected incidence convention.
     */
    region: ReturnType<IAutoMovieRecoveryEventRegion.Operation>;

    /**
     * Prepared immutable scalar face-interval index reused by all selected
     * plane or slab queries.
     */
    index: ReturnType<IAutoMovieRecoveryScalarIndex.Create>;
  };
}

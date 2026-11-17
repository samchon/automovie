import type { IAutoMovieRecoveryAtlasObservationState } from "./IAutoMovieRecoveryAtlasObservationState";
import type { IAutoMovieRecoveryEventRegion } from "./IAutoMovieRecoveryEventRegion";
import type { IAutoMovieRecoveryScalarIndex } from "./IAutoMovieRecoveryScalarIndex";
import type { IAutoMovieRecoveryScalarIntervalsSelectionOperation } from "./IAutoMovieRecoveryScalarIntervalsSelectionOperation";

/**
 * Admit the immutable source and prepare the selected scalar interval index.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Complete source-plane ordering used for deterministic scalar-interval selection. Admitted scalar interval selection, including explicit excluded-window accounting.
 * @evidence contracts/development/design.md#principled-representation Finite scalar projections aligned with source vertices, in the same units as query levels.
 * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryAtlasObservationSource, observeAutoMovieRecoveryAtlas share IAutoMovieRecoveryAtlasObservationSource's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export namespace IAutoMovieRecoveryAtlasObservationSource {
  /**
   * Admit the immutable source and prepare the selected scalar interval index.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Complete source-plane ordering used for deterministic scalar-interval selection. Admitted scalar interval selection, including explicit excluded-window accounting.
   * @evidence contracts/development/design.md#principled-representation Finite scalar projections aligned with source vertices, in the same units as query levels.
   * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryAtlasObservationSource, observeAutoMovieRecoveryAtlas share IAutoMovieRecoveryAtlasObservationSource's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
   */

  export type Operation = (
    input: IAutoMovieRecoveryAtlasObservationState["Input"],
  ) => {
    /** Complete source-plane ordering used for deterministic scalar-interval selection. */
    order: readonly number[];

    /** Admitted scalar interval selection, including explicit excluded-window accounting. */
    selection: ReturnType<IAutoMovieRecoveryScalarIntervalsSelectionOperation.Operation>;

    /** Finite scalar projections aligned with source vertices, in the same units as query levels. */
    heights: number[];

    /** Prepared source-cell query closure retaining the admitted source and selected incidence convention. */
    region: ReturnType<IAutoMovieRecoveryEventRegion.Operation>;

    /** Prepared immutable scalar face-interval index reused by all selected plane or slab queries. */
    index: ReturnType<IAutoMovieRecoveryScalarIndex.Create>;
  };
}

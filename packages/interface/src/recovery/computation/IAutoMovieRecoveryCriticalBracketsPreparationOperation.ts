import type {
  IAutoMovieMeshCriticalPoints,
  IAutoMovieRecoveryMeshSections,
} from "../../index";

/**
 * Prepare critical physical brackets and retain explicit unresolvable gaps.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Original critical vertex ordinals for which no admitted physical bracket was found. Critical events with admitted lower and upper physical scalar stations.
 * @evidence contracts/development/design.md#principled-representation Original critical vertex ordinals for which no admitted physical bracket was found.
 * @evidence contracts/development/design.md#minimal-and-owned-surface extractRecoveryMeshSections, observeRecoverySourceSlabs, observeRecoverySourceTerminals share IAutoMovieRecoveryCriticalBracketsPreparationOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export namespace IAutoMovieRecoveryCriticalBracketsPreparationOperation {
  /**
   * Prepare critical physical brackets and retain explicit unresolvable gaps.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Original critical vertex ordinals for which no admitted physical bracket was found. Critical events with admitted lower and upper physical scalar stations.
   * @evidence contracts/development/design.md#principled-representation Original critical vertex ordinals for which no admitted physical bracket was found.
   * @evidence contracts/development/design.md#minimal-and-owned-surface extractRecoveryMeshSections, observeRecoverySourceSlabs, observeRecoverySourceTerminals share IAutoMovieRecoveryCriticalBracketsPreparationOperation's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
   */

  export type Operation = (
    criticals: ReturnType<IAutoMovieMeshCriticalPoints.Operation>,
    heights: readonly number[],
    stepMm: number,
    levels: Set<number>,
    diagnostics: string[],
    topologyGaps: IAutoMovieRecoveryMeshSections["topologyGaps"],
  ) => {
    /** Original critical vertex ordinals for which no admitted physical bracket was found. */
    unsupportedVertices: Set<number>;

    /** Critical events with admitted lower and upper physical scalar stations. */
    bracketed: {
      /** Observed source critical vertex with its original scalar and link classifications. */
      event: ReturnType<IAutoMovieMeshCriticalPoints.Operation>[number];

      /** Lower admitted bracketing scalar coordinate, in millimetres. */
      before: number;

      /** Upper admitted bracketing scalar coordinate, in millimetres. */
      after: number;
    }[];
  };
}

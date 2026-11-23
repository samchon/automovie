import type {
  IAutoMovieMeshCriticalPoints,
  IAutoMovieRecoveryMeshSections,
} from "../../index";

/** Prepare critical physical brackets and retain explicit unresolvable gaps. */

export namespace IAutoMovieRecoveryCriticalBracketsPreparationOperation {
  /** Prepare critical physical brackets and retain explicit unresolvable gaps. */

  export type Operation = (
    criticals: ReturnType<IAutoMovieMeshCriticalPoints.Operation>,
    heights: readonly number[],
    stepMm: number,
    levels: Set<number>,
    diagnostics: string[],
    topologyGaps: IAutoMovieRecoveryMeshSections["topologyGaps"],
  ) => {
    /**
     * Original critical vertex ordinals for which no admitted physical bracket
     * was found.
     */
    unsupportedVertices: Set<number>;

    /** Critical events with admitted lower and upper physical scalar stations. */
    bracketed: {
      /**
       * Observed source critical vertex with its original scalar and link
       * classifications.
       */
      event: ReturnType<IAutoMovieMeshCriticalPoints.Operation>[number];

      /** Lower admitted bracketing scalar coordinate, in millimetres. */
      before: number;

      /** Upper admitted bracketing scalar coordinate, in millimetres. */
      after: number;
    }[];
  };
}

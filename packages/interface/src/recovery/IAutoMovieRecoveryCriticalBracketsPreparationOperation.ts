import type {
  IAutoMovieMeshCriticalPoints,
  IAutoMovieRecoveryMeshSections,
} from "..";

/** Callable preparation of physical observation brackets for original PL events. */

export namespace IAutoMovieRecoveryCriticalBracketsPreparationOperation {
  /**
   * Bracket each observed event within its neighboring signed source levels and
   * nominal station step. Amend the supplied station set and accumulate
   * diagnostics and topology gaps. Return all measured brackets and the
   * unsupported original vertices.
   */

  export type Operation = (
    criticals: ReturnType<IAutoMovieMeshCriticalPoints.Operation>,
    heights: readonly number[],
    stepMm: number,
    levels: Set<number>,
    diagnostics: string[],
    topologyGaps: IAutoMovieRecoveryMeshSections["topologyGaps"],
  ) => {
    /**
     * Original source vertices with unresolved precision or unsupported
     * critical links.
     */
    unsupportedVertices: Set<number>;

    /**
     * Physically measured before and after brackets for events with an admitted
     * offset.
     */
    bracketed: {
      /** Original observed critical vertex and its link witnesses. */
      event: ReturnType<IAutoMovieMeshCriticalPoints.Operation>[number];

      /** Lower signed bracket coordinate in millimetres. */
      before: number;

      /** Upper signed bracket coordinate in millimetres. */
      after: number;
    }[];
  };
}

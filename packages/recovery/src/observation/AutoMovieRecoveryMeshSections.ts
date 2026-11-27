import type {
  IAutoMovieRecoveryInput,
  IAutoMovieRecoveryMeshSections,
  IAutoMovieRecoverySourceLineage,
} from "@automovie/interface";

import { extractRecoveryMeshSections } from "../geometry/internal/extractRecoveryMeshSections";

/** Automatic section extraction and source-independent cubic publication. */
export namespace AutoMovieRecoveryMeshSections {
  /**
   * Extract every section component with automatic stations, feature corners
   * and PL critical brackets. Physical ties remain explicit; cutting and PL
   * topology share one immutable scalar chart. The optional progress observer
   * reports completed plane and slab populations without changing geometry. An
   * explicit sectionLimit publishes an incomplete sorted-station prefix;
   * coverage records the full omission. The optional lineage observer receives
   * copied incident face IDs per contour, including local failures and
   * degenerate contacts; callback exceptions escape the local fitting catch and
   * fail extraction.
   */
  export function extract(
    input: IAutoMovieRecoveryInput,
    progress?: (phase: string, completed: number, total: number) => void,
    sectionLimit?: number,
    onSourceLineage?: (observation: IAutoMovieRecoverySourceLineage) => void,
  ): IAutoMovieRecoveryMeshSections {
    return extractRecoveryMeshSections(
      input,
      progress,
      sectionLimit,
      onSourceLineage,
    );
  }
}

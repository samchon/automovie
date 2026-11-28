import type {
  IAutoMovieRecoveryInput,
  IAutoMovieRecoveryMeshSections,
  IAutoMovieRecoverySourceLineage,
} from "@automovie/interface";

import { extractRecoveryMeshSections } from "../geometry/internal/extractRecoveryMeshSections";

/** Automatic section extraction and source-independent cubic publication. */
export namespace AutoMovieRecoveryMeshSections {
  /**
   * Extract automatically placed sections from one registered mesh in
   * millimetres. An optional station limit publishes a sorted prefix and
   * reports incomplete coverage. Progress reports completed work. An optional
   * source-lineage observer receives copied original face addresses even for
   * isolated or locally failed contours.
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

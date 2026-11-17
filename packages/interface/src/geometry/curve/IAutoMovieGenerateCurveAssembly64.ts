import type { IAutoMovieCurveAssembly64 } from "./IAutoMovieCurveAssembly64";
import type { IAutoMovieCurveBoundaryEdge64 } from "./IAutoMovieCurveBoundaryEdge64";
import type { IAutoMovieCurveHierarchyFrame64 } from "./IAutoMovieCurveHierarchyFrame64";

/**
 * Data and callback contracts shared by the GenerateCurveAssembly64 operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Parent-ordered rigid frames, directed boundary edges and concrete region factories define one coefficient assembly. The result constraint preserves concrete factory data; graph validity and complete publication remain runtime checks, and callback effects are not rolled back.
 * @evidence contracts/development/design.md#principled-representation Parent-ordered rigid frames, directed boundary edges and concrete region factories define one coefficient assembly.
 * @evidence contracts/development/design.md#minimal-and-owned-surface generateAutoMovieCurveAssembly64 schedules the canonical CurveAssembly64 factories without owning region-specific generation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The result constraint preserves concrete factory data; graph validity and complete publication remain runtime checks, and callback effects are not rolled back.
 */
export namespace IAutoMovieGenerateCurveAssembly64 {
  /**
   * Construct caller-defined regions after their incoming boundary operators are published, retaining each concrete factory result. A thrown factory/publication failure aborts without returning a partial assembly; callback side effects remain the caller's responsibility.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Parent-ordered rigid frames, directed boundary edges and concrete region factories define one coefficient assembly. The result constraint preserves concrete factory data; graph validity and complete publication remain runtime checks, and callback effects are not rolled back.
   * @evidence contracts/development/design.md#principled-representation Parent-ordered rigid frames, directed boundary edges and concrete region factories define one coefficient assembly.
   * @evidence contracts/development/design.md#minimal-and-owned-surface generateAutoMovieCurveAssembly64 schedules the canonical CurveAssembly64 factories without owning region-specific generation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The result constraint preserves concrete factory data; graph validity and complete publication remain runtime checks, and callback effects are not rolled back.
   */
  export type IProps<T extends IAutoMovieCurveAssembly64.Result> = {
    /** Parent-relative rigid frames, with every parent appearing before its child. */
    frames: readonly IAutoMovieCurveHierarchyFrame64[];

    /** Directed named boundaries whose owner and consumer must each have a factory. */
    edges: readonly IAutoMovieCurveBoundaryEdge64[];

    /** Region callbacks retaining their concrete generated result type. */
    factories: readonly IAutoMovieCurveAssembly64.Factory<T>[];
  };
}

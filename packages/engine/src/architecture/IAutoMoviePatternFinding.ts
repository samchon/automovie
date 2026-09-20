/**
 * One structured defect or unsupported case a pattern run reports.
 *
 * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `IAutoMoviePatternFinding` represents one structured defect or unsupported case a pattern run reports. This ensures authored physical-module placement and texture sampling remain under project control.
 * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `IAutoMoviePatternFinding` structures one structured defect or unsupported case a pattern run reports for the system that resolves the declared physical-module pattern deterministically.
 */
export interface IAutoMoviePatternFinding {
  /**
   * What the run measured and found wanting.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-refusal `kind` records what the run measured and found wanting for `IAutoMoviePatternFinding`. This ensures invalid module layouts produce explicit findings instead of silent distortion or omission.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `kind` tells the engine what the run measured and found wanting for `IAutoMoviePatternFinding` as it resolves the declared physical-module pattern deterministically.
   */
  kind:
    | "sliver"
    | "unsupported-piece"
    | "module-overlap"
    | "joint-deviation"
    | "grain-break";
  /**
   * Occurrence ids involved, in ascending placement order.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `occurrences` records `IAutoMoviePatternFinding`'s occurrence ids involved, in ascending placement order. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `occurrences` supplies `IAutoMoviePatternFinding`'s occurrence ids involved, in ascending placement order when the engine resolves the declared physical-module pattern deterministically.
   */
  occurrences: string[];
  /**
   * The measured quantity, in the finding's own unit.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `measured` records `IAutoMoviePatternFinding`'s measured quantity, in the finding's own unit. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `measured` supplies `IAutoMoviePatternFinding`'s measured quantity, in the finding's own unit when the engine resolves the declared physical-module pattern deterministically.
   */
  measured: number;
  /**
   * The limit the measurement failed against.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `limit` records `IAutoMoviePatternFinding`'s limit the measurement failed against. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `limit` supplies `IAutoMoviePatternFinding`'s limit the measurement failed against when the engine resolves the declared physical-module pattern deterministically.
   */
  limit: number;
  /**
   * A statement an author or an agent can act on.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `detail` records `IAutoMoviePatternFinding`'s statement an author or an agent can act on. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `detail` supplies `IAutoMoviePatternFinding`'s statement an author or an agent can act on when the engine resolves the declared physical-module pattern deterministically.
   */
  detail: string;
}

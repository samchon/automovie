import type { IAutoMovieRecoveryEventCurveSource } from "../curve/IAutoMovieRecoveryEventCurveSource";

/**
 * Native boundary provenance for one generated tensor cell.
 *
 * @evidence contracts/common.md#principled-implementation Named fields preserve the existing producer's quantities, units and discriminants without changing its calculations.
 * @evidence contracts/common.md#clear-and-simple-design This shared contract gives the operation's callers and producer one explicit structural definition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration supplies no inferred measurements, fallback geometry or runtime defaults.
 * @evidence contracts/common.md#meaningful-documentation Members document physical units, budget meaning and completion or optional-state semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased contract performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type owns no cache or completed operation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Records are caller-owned and acquire no resources.
 */
export interface IAutoMovieRecoveryChartSourcePiece {
  /** Generated patch identity within the compiled chart. */
  patch: string;

  /** Native local interval [u0,u1,v0,v1]. */
  chart: [number, number, number, number];

  /** Bottom, right, top and left native intervals with declared coefficient authority. */
  boundaryCoefficientSources: IAutoMovieRecoveryEventCurveSource[];
}

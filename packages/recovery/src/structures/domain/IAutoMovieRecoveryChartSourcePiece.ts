import type { IAutoMovieRecoveryEventCurveSource } from "../curve/IAutoMovieRecoveryEventCurveSource";

/**
 * Native boundary provenance for one generated tensor cell.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve the existing producer's quantities, units and discriminants without changing its calculations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This shared contract gives the operation's callers and producer one explicit structural definition.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration supplies no inferred measurements, fallback geometry or runtime defaults.
 * @evidence contracts/development/common.md#meaningful-documentation Members document physical units, budget meaning and completion or optional-state semantics.
 */
export interface IAutoMovieRecoveryChartSourcePiece {
  /** Generated patch identity within the compiled chart. */
  patch: string;

  /** Native local interval [u0,u1,v0,v1]. */
  chart: [number, number, number, number];

  /** Bottom, right, top and left native intervals with declared coefficient authority. */
  boundaryCoefficientSources: IAutoMovieRecoveryEventCurveSource[];
}

import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * One actual face chart and its admitted physical2, never an exterior extension.
 *
 * @evidence contracts/development/design.md#principled-representation A trial records the admitted atlas face, its native coordinates and actual physical2, with crossed distinguishing boundary-foot initialization.
 * @evidence contracts/development/design.md#minimal-and-owned-surface SolidTraceTrial publishes the same surface jet consumed by intersection trial solvers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No extrapolated exterior jet is represented; surface admission must succeed before this record is constructed.
 * @evidence contracts/development/common.md#meaningful-documentation Defines chart ownership, crossing status and actual derivative availability.
 */
export interface IAutoMovieSolidTraceTrialTrial {
  /** Actual atlas face used by this query. */
  face: number;

  /** Admitted first chart coordinate. */
  u: number;

  /** Admitted second chart coordinate. */
  v: number;

  /** Whether the atlas supplied a boundary-foot initialization in another chart. */
  crossed: boolean;

  /** Actual map derivatives at that admitted chart point. */
  jet: IAutoMovieSolidSurface.IJet;
}

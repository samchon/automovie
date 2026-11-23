import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * One actual face chart and its admitted physical2, never an exterior
 * extension.
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

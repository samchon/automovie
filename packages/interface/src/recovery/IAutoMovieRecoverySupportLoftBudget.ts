/**
 * Finite limits for qualifying and realizing a convex-support loft. Engine
 * applies these controls to boundary planning and tessellation in the generated
 * model frame.
 */

export interface IAutoMovieRecoverySupportLoftBudget {
  /** Positive finite chord tolerance in model-space metres. */
  tolerance: number;

  /**
   * Positive safe integer cap on support planes. A realizable section needs at
   * least three surrounding directions.
   */
  maxPlanes: number;

  /**
   * Nonnegative safe integer cap on retained boundary events. Zero allows an
   * event-free result.
   */
  maxEvents: number;

  /** Positive safe integer cap on tessellation cells. */
  maxCells: number;

  /** Positive safe integer cap on generated vertices. */
  maxVertices: number;

  /**
   * Finite sine threshold strictly between zero and one for testing
   * support-plane direction pairs.
   */
  minimumDirectionSine: number;
}

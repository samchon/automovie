/**
 * One production-owned numeric caption boundary.
 *
 * @author Samchon
 */
export interface IAutoMovieCaptionReadabilityBoundary {
  /** Finite non-negative threshold value. */
  value: number;

  /** Whether equality satisfies this boundary. */
  inclusive: boolean;
}

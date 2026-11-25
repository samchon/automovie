/**
 * One production-owned numeric caption boundary. Its enclosing profile field
 * determines maximum versus minimum and the unit.
 */
export interface IAutoMovieCaptionReadabilityBoundary {
  /** Finite non-negative threshold value. */
  value: number;

  /** Whether equality satisfies this boundary. */
  inclusive: boolean;
}

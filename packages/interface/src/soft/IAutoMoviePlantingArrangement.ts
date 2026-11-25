import type { IAutoMoviePlantingPlacement } from "./IAutoMoviePlantingPlacement";
import type { IAutoMovieSoftBounds } from "./IAutoMovieSoftBounds";

/**
 * The deterministic arrangement of one planting cluster.
 *
 * Members depend on the complete cluster: seed, count, anchor, extent, spacing,
 * attempts, scale and yaw choices. The seeded algorithm replays those admitted
 * inputs and counts refusal; this record carries no independently observed
 * cross-platform bit certificate.
 */
export interface IAutoMoviePlantingArrangement {
  /** Identity of the cluster this arrangement was derived from. */
  cluster: string;

  /** Identity of the recipe every member grows from. */
  domain: string;

  /** Accepted members, in authored slot order. */
  placements: IAutoMoviePlantingPlacement[];

  /**
   * Members refused because no attempt honoured the minimum spacing.
   *
   * Reported rather than absorbed: a cluster asked for `count` plants and got
   * fewer, and the number that did not fit is the evidence an author needs to
   * widen the bed or loosen the spacing.
   */
  rejected: number;

  /**
   * World-meter bounds of accepted placement origins, excluding grown geometry;
   * null when no placement was accepted.
   */
  bounds: IAutoMovieSoftBounds | null;
}

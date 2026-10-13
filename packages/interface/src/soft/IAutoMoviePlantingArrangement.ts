import { IAutoMoviePlantingPlacement } from "./IAutoMoviePlantingPlacement";
import { IAutoMovieSoftBounds } from "./IAutoMovieSoftBounds";

/**
 * The deterministic arrangement of one planting cluster.
 *
 * Members are generated from the cluster seed alone, so the same cluster is the
 * same arrangement everywhere, and refusals are counted rather than hidden.
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

  /** World extent of the accepted placements, or `null` when none were. */
  bounds: IAutoMovieSoftBounds | null;
}

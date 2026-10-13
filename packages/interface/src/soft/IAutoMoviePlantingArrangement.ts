import { IAutoMoviePlantingPlacement } from "./IAutoMoviePlantingPlacement";
import { IAutoMovieSoftBounds } from "./IAutoMovieSoftBounds";

/**
 * The deterministic arrangement of one planting cluster.
 *
 * Members are generated from the cluster seed alone, so the same cluster is the same arrangement everywhere, and refusals are counted rather than hidden.
 *
 * @evidence contracts/common.md#principled-implementation arrangePlantingCluster derives candidates from seed, slot and attempt, accepts minimum-spaced positions against already placed members and reports rejected slots with exact accepted full-TRS placements.
 * @evidence contracts/common.md#clear-and-simple-design The result separates requested cluster/recipe identity from accepted positions, refusal count and nullable placement-origin bounds.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Refused members are counted rather than squeezed into overlaps, and bounds concern accepted placement origins rather than the full grown plant geometry.
 * @evidence contracts/common.md#meaningful-documentation Defines cluster/domain attribution, authored slot order, spacing refusal and empty nullable origin bounds.
 * @author Samchon
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
   * Reported rather than absorbed: a cluster asked for `count` plants and got fewer, and the number that did not fit is the evidence an author needs to widen the bed or loosen the spacing.
   */
  rejected: number;

  /** World-meter bounds of accepted placement origins, excluding grown geometry; null when no placement was accepted. */
  bounds: IAutoMovieSoftBounds | null;
}

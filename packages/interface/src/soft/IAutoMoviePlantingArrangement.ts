import { IAutoMovieSoftBounds } from "./IAutoMovieSoftBounds";
import { IAutoMoviePlantingPlacement } from "./IAutoMoviePlantingPlacement";

/**
 * The deterministic arrangement of one planting cluster.
 *
 * Members are generated from the cluster seed alone, so the same cluster is the
 * same arrangement everywhere, and refusals are counted rather than hidden.
 *
 * @evidence requirements/map/vegetation-and-ecology.md#map-vegetation-individual-cluster Exposes `IAutoMoviePlantingArrangement` as the portable data boundary for the map vegetation individual cluster requirement.
 * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-vegetation-layer-form-input Types `IAutoMoviePlantingArrangement` for the world site vegetation layer form input system contract.
 */
export interface IAutoMoviePlantingArrangement {
  /**
   * Identity of the cluster this arrangement was derived from.
   *
   * @evidence requirements/map/vegetation-and-ecology.md#map-vegetation-individual-cluster Exposes `cluster` as the portable data boundary for the map vegetation individual cluster requirement.
   * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-vegetation-layer-form-input Types `cluster` for the world site vegetation layer form input system contract.
   */
  cluster: string;

  /**
   * Identity of the recipe every member grows from.
   *
   * @evidence requirements/map/vegetation-and-ecology.md#map-vegetation-individual-cluster Exposes `domain` as the portable data boundary for the map vegetation individual cluster requirement.
   * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-vegetation-layer-form-input Types `domain` for the world site vegetation layer form input system contract.
   */
  domain: string;

  /**
   * Accepted members, in authored slot order.
   *
   * @evidence requirements/map/vegetation-and-ecology.md#map-vegetation-individual-cluster Exposes `placements` as the portable data boundary for the map vegetation individual cluster requirement.
   * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-vegetation-layer-form-input Types `placements` for the world site vegetation layer form input system contract.
   */
  placements: IAutoMoviePlantingPlacement[];

  /**
   * Members refused because no attempt honoured the minimum spacing.
   *
   * Reported rather than absorbed: a cluster asked for `count` plants and got
   * fewer, and the number that did not fit is the evidence an author needs to
   * widen the bed or loosen the spacing.
   *
   * @evidence requirements/map/vegetation-and-ecology.md#map-vegetation-individual-cluster Exposes `rejected` as the portable data boundary for the map vegetation individual cluster requirement.
   * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-vegetation-layer-form-input Types `rejected` for the world site vegetation layer form input system contract.
   */
  rejected: number;

  /**
   * World extent of the accepted placements, or `null` when none were.
   *
   * @evidence requirements/map/vegetation-and-ecology.md#map-vegetation-individual-cluster Exposes `bounds` as the portable data boundary for the map vegetation individual cluster requirement.
   * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-vegetation-layer-form-input Types `bounds` for the world site vegetation layer form input system contract.
   */
  bounds: IAutoMovieSoftBounds | null;
}

import type { AutoMoviePlantingIrrigationMedium } from "./AutoMoviePlantingIrrigationMedium";

/**
 * How a planting is watered.
 *
 * The supply names an architectural element rather than a typed service-network
 * port. Binding validation checks that reference, daily demand, medium and an
 * aquatic installation's fluid-domain join; this record does not prove service
 * capacity or water delivery.
 */
export interface IAutoMoviePlantingIrrigation {
  /** Id of the environment element acting as the supply port. */
  port: string;

  /** Water demand in litres per day; strictly positive. */
  demandLitresPerDay: number;

  /** What the supply carries. */
  medium: AutoMoviePlantingIrrigationMedium;

  /**
   * Id of the fluid domain the planting stands in, or `null` when it does not.
   *
   * Required exactly for `aquatic` planting and forbidden otherwise: a reed bed
   * with no water is not aquatic, and a potted fern citing a pond is a binding
   * error rather than a decorative note.
   */
  fluidDomain: string | null;
}

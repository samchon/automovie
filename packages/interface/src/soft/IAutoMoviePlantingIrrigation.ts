import { AutoMoviePlantingIrrigationMedium } from "./AutoMoviePlantingIrrigationMedium";

/**
 * How a planting is watered.
 *
 * The supply names an architectural element rather than a typed service-network port. Binding validation checks that reference, daily demand, medium and an aquatic installation's fluid-domain join; this record does not prove service capacity or water delivery.
 *
 * @evidence contracts/common.md#principled-implementation Binding admission resolves the supply as an environment element and positive daily liter demand, requiring a compatible fluid-domain reference exactly for aquatic installations.
 * @evidence contracts/common.md#clear-and-simple-design Planting supply declaration stays separate from the full service graph because its current port field names an architectural element rather than a typed service port.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This record verifies joins and declared demand, not actual service capacity or water delivery; nonaquatic fluid references and aquatic missing domains refuse.
 * @evidence contracts/common.md#meaningful-documentation Defines element-based supply, liters-per-day demand, medium and aquatic-only nullable fluid-domain ownership.
 * @author Samchon
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
   * Required exactly for `aquatic` planting and forbidden otherwise: a reed bed with no water is not aquatic, and a potted fern citing a pond is a binding error rather than a decorative note.
   */
  fluidDomain: string | null;
}

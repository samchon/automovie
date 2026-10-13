import { AutoMoviePlantingIrrigationMedium } from "./AutoMoviePlantingIrrigationMedium";

/**
 * How a planting is watered.
 *
 * The supply is named as a building element acting as the port, because that is
 * what exists today; a full typed service network is a separate concern and
 * this record must not pretend to be one. What it does state completely is the
 * demand, the medium, and — for aquatic planting — the fluid domain the roots
 * actually stand in, which the engine checks rather than trusts.
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

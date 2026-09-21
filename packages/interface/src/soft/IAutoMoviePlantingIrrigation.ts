import { AutoMoviePlantingIrrigationMedium } from "./AutoMoviePlantingIrrigationMedium";

/**
 * How a planting is watered.
 *
 * The supply is named as a building element acting as the port, because that is
 * what exists today; a full typed service network is a separate concern and
 * this record must not pretend to be one. What it does state completely is the
 * demand, the medium, and — for aquatic planting — the fluid domain the roots
 * actually stand in, which the engine checks rather than trusts.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `IAutoMoviePlantingIrrigation` as the portable data boundary for the interior plant placement state requirement.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `IAutoMoviePlantingIrrigation` for the interior space soft furnishing planting system contract.
 */
export interface IAutoMoviePlantingIrrigation {
  /**
   * Id of the environment element acting as the supply port.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `port` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `port` for the interior space soft furnishing planting system contract.
   */
  port: string;

  /**
   * Water demand in litres per day; strictly positive.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `demandLitresPerDay` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `demandLitresPerDay` for the interior space soft furnishing planting system contract.
   */
  demandLitresPerDay: number;

  /**
   * What the supply carries.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `medium` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `medium` for the interior space soft furnishing planting system contract.
   */
  medium: AutoMoviePlantingIrrigationMedium;

  /**
   * Id of the fluid domain the planting stands in, or `null` when it does not.
   *
   * Required exactly for `aquatic` planting and forbidden otherwise: a reed bed
   * with no water is not aquatic, and a potted fern citing a pond is a binding
   * error rather than a decorative note.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `fluidDomain` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `fluidDomain` for the interior space soft furnishing planting system contract.
   */
  fluidDomain: string | null;
}

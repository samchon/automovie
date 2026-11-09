import {
  IAutoMoviePlantingArrangement,
  IAutoMoviePlantingState,
  IAutoMovieSoftAnalysis,
} from "@automovie/interface";

/**
 * One lowerPlantingInstallation result and its explicit analysis status.
 *
 * @evidence contracts/development/design.md#principled-representation Prototype growth and arranged instances accompany an analysis record; null derivative fields distinguish an unperformed derivation from an empty successful population.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Installation identity joins the prototype and arrangement that soft-content consumers need without copying the domain's authored configuration.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unsupported derivations remain null with analysis reasons rather than fabricated plant geometry or an implicit success flag.
 * @evidence contracts/development/common.md#meaningful-documentation Names the lowering producer and documents installation identity, prototype/arrangement roles and each not-run null state.
 */
export interface IAutoMoviePlantingFrame {
  /** Identity of the installation the frame belongs to. */
  installation: string;

  /** What the derivation actually did, including anything it declined. */
  analysis: IAutoMovieSoftAnalysis;

  /** The prototype structure every member instances, or `null` when not run. */
  plant: IAutoMoviePlantingState | null;

  /** The deterministic member arrangement, or `null` when not run. */
  arrangement: IAutoMoviePlantingArrangement | null;
}

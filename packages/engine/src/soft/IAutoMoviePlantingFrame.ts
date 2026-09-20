import { IAutoMoviePlantingArrangement, IAutoMoviePlantingState, IAutoMovieSoftAnalysis } from "@automovie/interface";

/**
 * One installation's derived planting, beside an honest account of it.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Carries both the derived planting state and its named outcome.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Exposes one renderer-ready interior planting result.
 */
export interface IAutoMoviePlantingFrame {
  /**
   * Identity of the installation the frame belongs to.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Preserves which authored installation owns the result.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Keeps the lowered planting addressable at its installation boundary.
   */
  installation: string;

  /**
   * What the derivation actually did, including anything it declined.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-simulation-bound Reports whether bounded planting derivation ran or was refused.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Carries the status and measured work of the planting result.
   */
  analysis: IAutoMovieSoftAnalysis;

  /**
   * The prototype structure every member instances, or `null` when not run.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Carries the generated plant shared by placed members.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Separates the procedural prototype from its installation arrangement.
   */
  plant: IAutoMoviePlantingState | null;

  /**
   * The deterministic member arrangement, or `null` when not run.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Carries the bounded positions of the planting population.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Exposes the installation transforms independently of prototype geometry.
   */
  arrangement: IAutoMoviePlantingArrangement | null;
}

import type { IAutoMoviePlantingArrangement } from "./IAutoMoviePlantingArrangement";
import type { IAutoMoviePlantingState } from "./IAutoMoviePlantingState";
import type { IAutoMovieSoftAnalysis } from "./IAutoMovieSoftAnalysis";

/** One lowerPlantingInstallation result and its explicit analysis status. */
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

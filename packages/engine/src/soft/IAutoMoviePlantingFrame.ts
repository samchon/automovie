import {
  IAutoMoviePlantingArrangement,
  IAutoMoviePlantingState,
  IAutoMovieSoftAnalysis,
} from "@automovie/interface";

/** One installation's derived planting, beside an honest account of it. */
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

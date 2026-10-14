import { IAutoMoviePlantingArrangement, IAutoMoviePlantingState, IAutoMovieSoftAnalysis } from "@automovie/interface";
/**
 * One lowerPlantingInstallation result and its explicit analysis status.
 *
 * @evidence contracts/common.md#principled-implementation Prototype growth and arranged instances accompany an analysis record; null derivative fields distinguish an unperformed derivation from an empty successful population.
 * @evidence contracts/common.md#clear-and-simple-design Installation identity joins the prototype and arrangement that soft-content consumers need without copying the domain's authored configuration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported derivations remain null with analysis reasons rather than fabricated plant geometry or an implicit success flag.
 * @evidence contracts/common.md#meaningful-documentation Names the lowering producer and documents installation identity, prototype/arrangement roles and each not-run null state.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This result type runs no growth or arrangement algorithm; their costs belong to the respective producers.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Frame data joins one installation result and coordinates no retained cross-installation derivation cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller-owned plant and arrangement populations determine retained size; the record itself acquires no host or simulation task.
 * @author Samchon
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

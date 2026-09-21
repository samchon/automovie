import { AutoMovieFilmTime } from "./AutoMovieFilmTime";

/**
 * One declared audio asset placement.
 *
 * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `IAutoMovieAudioCue` as the portable data boundary for the asset generation provider independence requirement.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `IAutoMovieAudioCue` for the asset spec generation provider choice system contract.
 */
export interface IAutoMovieAudioCue {
  /**
   * Stable cue id.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `id` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `id` for the asset spec generation provider choice system contract.
   */
  id: string;

  /**
   * Project-relative declared render-content asset.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `asset` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `asset` for the asset spec generation provider choice system contract.
   */
  asset: string;

  /**
   * Declared source duration used for bounded trim validation.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `sourceDuration` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `sourceDuration` for the asset spec generation provider choice system contract.
   */
  sourceDuration: AutoMovieFilmTime;

  /**
   * Source offset inside the asset.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `sourceOffset` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `sourceOffset` for the asset spec generation provider choice system contract.
   */
  sourceOffset: AutoMovieFilmTime;

  /**
   * Film-global cue start.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `start` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `start` for the asset spec generation provider choice system contract.
   */
  start: AutoMovieFilmTime;

  /**
   * Cue duration.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `duration` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `duration` for the asset spec generation provider choice system contract.
   */
  duration: AutoMovieFilmTime;

  /**
   * Linear gain from silence through a bounded boost.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `gain` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `gain` for the asset spec generation provider choice system contract.
   */
  gain: number;

  /**
   * Fade-in duration.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `fadeIn` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `fadeIn` for the asset spec generation provider choice system contract.
   */
  fadeIn: AutoMovieFilmTime;

  /**
   * Fade-out duration.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `fadeOut` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `fadeOut` for the asset spec generation provider choice system contract.
   */
  fadeOut: AutoMovieFilmTime;

  /**
   * Deterministic destination bus.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `bus` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `bus` for the asset spec generation provider choice system contract.
   */
  bus: "dialogue" | "music" | "effects" | "ambience";
}

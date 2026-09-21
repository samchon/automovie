import { IAutoMovieCaptionReadabilityReport } from "./IAutoMovieCaptionReadabilityReport";
import { IAutoMovieDiagnostic } from "./IAutoMovieDiagnostic";
import { IAutoMovieProductionDesignInventory } from "./IAutoMovieProductionDesignInventory";
import { IAutoMovieProductionNextAction } from "./IAutoMovieProductionNextAction";
import { IAutoMovieProductionRenderStatus } from "./IAutoMovieProductionRenderStatus";

/**
 * Compact project status for CLI and lint consumers.
 *
 * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `IAutoMovieProductionInspection` as the portable data boundary for the asset generation provider independence requirement.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `IAutoMovieProductionInspection` for the asset spec generation provider choice system contract.
 */
export interface IAutoMovieProductionInspection {
  /**
   * Current project revision.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `revision` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `revision` for the asset spec generation provider choice system contract.
   */
  revision: number;

  /**
   * Typed design inventory.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `design` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `design` for the asset spec generation provider choice system contract.
   */
  design: IAutoMovieProductionDesignInventory;

  /**
   * Coding-agent and builder ownership status.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `source` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `source` for the asset spec generation provider choice system contract.
   */
  source: {
    /** Bound source modules that currently exist. */
    bound: string[];

    /** Bound source modules that are missing or unsafe. */
    missing: string[];

    /** Files under generated absent from its manifest. */
    unownedGenerated: string[];
  };

  /**
   * Current structural and ownership diagnostics.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `diagnostics` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `diagnostics` for the asset spec generation provider choice system contract.
   */
  diagnostics: IAutoMovieDiagnostic[];

  /**
   * Discovered render manifests.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `renders` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `renders` for the asset spec generation provider choice system contract.
   */
  renders: IAutoMovieProductionRenderStatus[];

  /**
   * Current caption readability measurements and outcomes for the film edit.
   *
   * This report is outside the generated edit so a production declaring no
   * profile retains byte-identical compiled output while still exposing a
   * measure-only result.
   *
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Reports measurement without inventing a missing profile verdict.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Keeps measure-only status explicit at the inspection boundary.
   */
  captionReadability: IAutoMovieCaptionReadabilityReport;

  /**
   * Ordered concrete corrections.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `nextActions` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `nextActions` for the asset spec generation provider choice system contract.
   */
  nextActions: IAutoMovieProductionNextAction[];
}

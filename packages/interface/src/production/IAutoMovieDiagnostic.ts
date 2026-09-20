import { AutoMovieDiagnosticCode } from "./AutoMovieDiagnosticCode";

/**
 * A stable production diagnostic returned by builder and lint.
 *
 * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `IAutoMovieDiagnostic` as the portable data boundary for the asset generation provider independence requirement.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `IAutoMovieDiagnostic` for the asset spec generation provider choice system contract.
 */
export interface IAutoMovieDiagnostic {
  /**
   * Machine-readable diagnostic code from the shipped closed catalog.
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-code-catalog-reference Restricts actual delivery to one enumerable code set.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-code-catalog-reference Uses the same key union the exhaustive catalog maps.
   */
  code: AutoMovieDiagnosticCode;

  /**
   * Whether the diagnostic blocks the current operation.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `category` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `category` for the asset spec generation provider choice system contract.
   */
  category: "error" | "warning";

  /**
   * Pipeline phase that owns the correction.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `phase` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `phase` for the asset spec generation provider choice system contract.
   */
  phase: "project" | "design" | "source" | "compile" | "review" | "render";

  /**
   * Stable target identity.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `target` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `target` for the asset spec generation provider choice system contract.
   */
  target: string;

  /**
   * Project-relative file or null when no one file owns it.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `path` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `path` for the asset spec generation provider choice system contract.
   */
  path: string | null;

  /**
   * Human-readable cause followed by the concrete correction owned by this
   * phase. Do not discard it and retry unchanged.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `message` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `message` for the asset spec generation provider choice system contract.
   */
  message: string;
}

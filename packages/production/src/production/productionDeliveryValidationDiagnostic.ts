import { AutoMovieDiagnosticCode, IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Construct a render-phase production error for delivery review or capture refusal; target identifies the caller's production, deliverable, shot, or asset. Omitted path is represented by null, and the caller owns collection and publication of the record.
 *
 * @evidence contracts/common.md#principled-implementation A fixed diagnostic record copies the supplied code, target, message, and optional path without transforming error text or inferring a successful replacement output.
 * @evidence contracts/common.md#clear-and-simple-design The common render error shape stays in one helper so manifest, timeline, rendition, frame capture, turntable, and rigged-asset refusals share the same category and phase without another constructor.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The phase and error category are the actual production delivery and capture diagnostic protocol. No consumer-specific severity, fixture exception, or hidden recovery path is selected.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies render phase, error category, null path default, and caller ownership; no diagnostic delivery side effect occurs here.
 * @evidence contracts/performance.md#efficient-algorithms Record allocation and scalar reference assignment are constant in field count, with the provided strings retained by reference rather than scanned or copied.
 * @evidence contracts/performance.md#reuse-equivalent-work Each failure receives its own diagnostic record because code, target, message, and path define that occurrence; no mutable diagnostic object is shared across failures.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned record belongs to the caller's diagnostic collection. This helper owns no retained registry, handles, buffers, or running tasks.
 */
export const productionDeliveryValidationDiagnostic: (code: AutoMovieDiagnosticCode, target: string, message: string, renderPath?: string | null) => IAutoMovieDiagnostic = (
  code: AutoMovieDiagnosticCode,
  target: string,
  message: string,
  renderPath: string | null = null,
): IAutoMovieDiagnostic => ({
  code,
  category: "error",
  phase: "render",
  target,
  path: renderPath,
  message,
});

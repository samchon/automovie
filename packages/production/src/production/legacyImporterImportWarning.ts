import { AutoMovieDiagnosticCode, IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Create a project-phase warning with the supplied diagnostic code, semantic target, optional source path and reconstruction message; callers own the reason and ordering.
 *
 * @evidence contracts/common.md#principled-implementation Closed diagnostic code/category/phase fields preserve the production warning representation while caller facts supply target and path.
 * @evidence contracts/common.md#clear-and-simple-design One record composer keeps warning structure consistent across defaults, missing source and missing asset reports.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not turn a draft reconstruction warning into a validation pass or invent an affected source path when none exists.
 * @evidence contracts/common.md#meaningful-documentation States project warning purpose, optional path meaning and caller ownership of reason/order.
 * @evidence contracts/performance.md#efficient-algorithms Constructs a fixed field set retaining supplied strings by reference, with constant application work.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the diagnostic schema and caller message values but does not memoize warnings for different draft facts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one value record; its enclosing plan owns retained warning/message population and no native resource is acquired.
 */
export const legacyImporterImportWarning: (code: AutoMovieDiagnosticCode, target: string, pathValue: string | null, message: string) => IAutoMovieDiagnostic = (
  code: AutoMovieDiagnosticCode,
  target: string,
  pathValue: string | null,
  message: string,
): IAutoMovieDiagnostic => ({
  code,
  category: "warning",
  phase: "project",
  target,
  path: pathValue,
  message,
});

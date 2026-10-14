import type { IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Observed registration/execution result of a synchronous authored source export.
 *
 * @evidence contracts/common.md#principled-implementation Current shot/film object schemas reserve null for execution or schema refusal and diagnostics retain that source boundary; generic T does not independently exclude a successful null value. registrationScene is supplied only after an exact shot registration was observed.
 * @evidence contracts/common.md#clear-and-simple-design Shot and film source assembly consume this shared result instead of maintaining separate execution-refusal shapes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The result does not certify sandboxing, deterministic effects or physical publication; validated data means the selected schema admitted the returned value.
 * @evidence contracts/common.md#meaningful-documentation States null refusal, diagnostic ownership and optional admitted registration scene.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A result type executes no module load or schema validation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type defines no cache across changing authored modules.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The compiling attempt owns the returned value and diagnostics until transfer or refusal; the type opens no resource.
 * @author Samchon
 */
export interface ISourceBuildResult<T> {
  /** The validated build value, or null when source execution failed. */
  value: T | null;

  /** Failures and warnings observed while loading and validating the source. */
  diagnostics: IAutoMovieDiagnostic[];

  /** Source-owned scene captured from a validated defineShot registration. */
  registrationScene?: string;
}

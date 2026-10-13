import { AutoMovieDiagnosticCode } from "./AutoMovieDiagnosticCode";

/**
 * Stable production finding with a machine identity and an owned correction.
 *
 * @evidence contracts/common.md#principled-implementation Closed diagnostic code, severity and pipeline phase identify the violated obligation, while target and optional file locate it; builders refuse error-level findings and preserve warnings as correction information.
 * @evidence contracts/common.md#clear-and-simple-design Machine classification and human correction prose occupy separate fields, allowing clients to group findings without parsing messages or losing the exact author action.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unchanged retry cannot substitute for the stated correction, and a null file explicitly denotes a finding with no single file owner rather than inventing a misleading path.
 * @evidence contracts/common.md#meaningful-documentation Gives catalog ownership, blocking category, correction phase, stable target, optional project-relative location and actionable cause-plus-correction message semantics.
 * @author Samchon
 */
export interface IAutoMovieDiagnostic {
  /** Machine-readable diagnostic code from the shipped closed catalog. */
  code: AutoMovieDiagnosticCode;

  /** Whether the diagnostic blocks the current operation. */
  category: "error" | "warning";

  /** Pipeline phase that owns the correction. */
  phase: "project" | "design" | "source" | "compile" | "review" | "render";

  /** Stable target identity. */
  target: string;

  /** Project-relative file or null when no one file owns it. */
  path: string | null;

  /**
   * Human-readable cause followed by the concrete correction owned by this phase. Do not discard it and retry unchanged.
   */
  message: string;
}

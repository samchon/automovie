import { AutoMovieDiagnosticCode } from "./AutoMovieDiagnosticCode";

/** A stable production diagnostic returned by builder and lint. */
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
   * Human-readable cause followed by the concrete correction owned by this
   * phase. Do not discard it and retry unchanged.
   */
  message: string;
}

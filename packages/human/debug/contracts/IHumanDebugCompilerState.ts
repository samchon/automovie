/**
 * The latest cycle of the separate `ttsc --watch` type check, as the compiler route reports it.
 *
 * `unknown` means the log is missing or unreadable, which says nothing about the source.
 */
export interface IHumanDebugCompilerState {
  /** State of the latest cycle. */
  phase: "checking" | "passed" | "failed" | "unknown";

  /** Diagnostics of the latest cycle, at most 128 KiB, or the reason the log is unreadable. */
  output: string;

  /** Path of the log read. */
  log: string;

  /** The cycle's opening line, or null before the first cycle. */
  cycle: string | null;
}

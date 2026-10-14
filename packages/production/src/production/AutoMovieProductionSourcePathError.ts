/**
 * Source-read refusal classified for the production builder diagnostic boundary.
 *
 * @evidence contracts/common.md#principled-implementation Native Error carries the read failure while a closed missing/outside-root reason lets productionBuildDiagnostics choose the owning source correction without interpreting message text.
 * @evidence contracts/common.md#clear-and-simple-design The project source readers produce this error and the builder boundary consumes the same constructor identity; no retry or source fallback is installed here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reasons describe the failed source relation rather than a particular path or consumer; constructor behavior preserves native Error naming and supplied message.
 * @evidence contracts/common.md#meaningful-documentation States classification ownership and diagnostic consumer; the error itself does not prove current filesystem identity or perform recovery.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This error representation chooses no filesystem search or validation algorithm; its constructor delegates native error creation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A failure instance is one occurrence, not a cacheable source-read result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The throwing reader and catcher own the error's message, classification and native stack; it retains no descriptor, buffer or task.
 */
export class AutoMovieProductionSourcePathError extends Error {
  /** Preserve the supplied relation/message and native Error stack/name semantics. */
  public constructor(
    /** Stable failed source-root relation. */
    public readonly reason: "missing" | "outside-root",

    /** Reader-supplied explanation passed unchanged to native Error construction. */
    message: string,
  ) { super(message); }
}

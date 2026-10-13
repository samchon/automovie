import type { AutoMovieDesignDerivationFailureCode } from "./AutoMovieDesignDerivationFailureCode";

/**
 * A derivation refusal carrying its original category and explanation.
 *
 * @evidence contracts/common.md#principled-implementation An Error subclass preserves the supplied code/message and sets AutoMovieDesignDerivationError as its diagnostic name.
 * @evidence contracts/common.md#clear-and-simple-design Candidate and sequential-run refusal branches share one structured error identity without owning publication effects in the class.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Publication failure can follow earlier successful stores; constructing this Error provides no rollback or no-write guarantee.
 * @evidence contracts/common.md#meaningful-documentation Documents readonly category, original explanation and the partial-write meaning of publication refusal.
 * @evidence contracts/performance.md#efficient-algorithms Message retention and native Error stack capture depend on text/runtime stack size; one code/name assignment adds fixed work.
 * @evidence contracts/performance.md#reuse-equivalent-work Each thrown cause is its own observation and no Error result is cached or replayed as successful publication.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Catching callers retain code, message and runtime stack without a string-size cap; no source bytes, store transaction or native handle is owned by the class.
 *
 * @author Samchon
 */
export class AutoMovieDesignDerivationError extends Error {
  public constructor(
    /** Stable machine-readable refusal category. */
    public readonly code: AutoMovieDesignDerivationFailureCode,
    message: string,
  ) {
    super(message);
    this.name = "AutoMovieDesignDerivationError";
  }
}

import type { AutoMovieUtf8ErrorCategory } from "./AutoMovieUtf8ErrorCategory";

/**
 * Retain the logical record, first proving byte offset and stable UTF-8 refusal category.
 *
 * @evidence contracts/common.md#principled-implementation An Error subclass preserves record/offset/category and the existing machine code, message and diagnostic name.
 * @evidence contracts/common.md#clear-and-simple-design Strict validation and BOM policy share this refusal identity; JSON/reference ingress can add their own context while retaining its actual category.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A typed refusal does not contain replacement text or imply successful recovery; category and byte offset describe the observed input failure.
 * @evidence contracts/common.md#meaningful-documentation Defines the record label, zero-based proving byte offset and stable category used by callers and tests.
 * @evidence contracts/performance.md#efficient-algorithms Message construction scales with record/category text and runtime-dependent native stack capture.
 * @evidence contracts/performance.md#reuse-equivalent-work Each failure is an independent observation; the class retains no cached valid decode result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Catching callers retain strings and native stack until release; no input buffer or external handle is directly stored.
 *
 * @author Samchon
 */
export class AutoMovieUtf8Error extends Error {
  /** Stable machine-readable diagnostic code. */
  public readonly code: "automovie-invalid-utf8" = "automovie-invalid-utf8" as const;

  public constructor(
    /** Logical record or asset being decoded. */
    public readonly record: string,

    /** First byte that proves the sequence invalid. */
    public readonly offset: number,

    /** Stable reason independent of the host decoder's wording. */
    public readonly category: AutoMovieUtf8ErrorCategory,
  ) {
    super(
      `AutoMovie text record "${record}" has invalid UTF-8 at byte ${offset} (${category}).`,
    );
    this.name = "AutoMovieUtf8Error";
  }
}

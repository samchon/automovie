import { AutoMovieCanonicalJsonErrorCategory } from "./AutoMovieCanonicalJsonErrorCategory";

/**
 * Carry a closed canonical-JSON domain refusal without publishing partial identity text.
 *
 * @evidence contracts/common.md#principled-implementation A TypeError subclass records a stable code and one declared category; the canonicalizer creates it for its explicit domain checks, while host allocation, recursion and Proxy failures need not have this type.
 * @evidence contracts/common.md#clear-and-simple-design The failure data keeps machine classification independent of message formatting and hashing consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No invalid value is coerced into canonical success, and callers need not parse host-specific error wording to recognize the five domain categories.
 * @evidence contracts/common.md#meaningful-documentation Documents stable code/category, TypeError inheritance and the distinction between domain refusal and every possible runtime exception.
 * @evidence contracts/performance.md#efficient-algorithms Construction formats one detail string and creates the host error/stack with runtime-dependent cost; it does not traverse the rejected value.
 * @evidence contracts/performance.md#reuse-equivalent-work All domain checks reuse this failure shape, while each refusal gets its own message/category instead of a shared mutable Error.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The catcher owns the error and its host stack until discarded; no source graph, partial output or active task is retained explicitly.
 */
export class AutoMovieCanonicalJsonError extends TypeError {
  /** Stable machine-readable diagnostic code. */
  public readonly code = "automovie-canonical-json-invalid" as const;

  public constructor(
    /** Stable refusal category independent of engine error wording. */
    public readonly category: AutoMovieCanonicalJsonErrorCategory,
    detail: string,
  ) {
    super(`AutoMovie canonical JSON refused ${category}: ${detail}`);
    this.name = "AutoMovieCanonicalJsonError";
  }
}

import { AutoMovieCanonicalJsonErrorCategory } from "./AutoMovieCanonicalJsonErrorCategory";

/**
 * Carry a closed canonical-JSON domain refusal without publishing partial identity text.
 *
 * @evidence contracts/development/design.md#principled-representation A TypeError subclass records a stable code and one declared category; the canonicalizer creates it for its explicit domain checks, while host allocation, recursion and Proxy failures need not have this type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The failure data keeps machine classification independent of message formatting and hashing consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No invalid value is coerced into canonical success, and callers need not parse host-specific error wording to recognize the five domain categories.
 * @evidence contracts/development/common.md#meaningful-documentation Documents stable code/category, TypeError inheritance and the distinction between domain refusal and every possible runtime exception.
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

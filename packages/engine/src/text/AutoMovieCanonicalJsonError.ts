import { AutoMovieCanonicalJsonErrorCategory } from "./AutoMovieCanonicalJsonErrorCategory";

/**
 * A typed refusal that never emits partial canonical text or identity.
 *
 * It extends `TypeError` because every refusal is a value outside the accepted
 * domain, and it carries a closed category so callers branch on the violated
 * rule instead of parsing a message.
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

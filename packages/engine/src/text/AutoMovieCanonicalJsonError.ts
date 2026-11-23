import type { AutoMovieCanonicalJsonErrorCategory } from "@automovie/interface";

/**
 * Carry a closed canonical-JSON domain refusal without publishing partial
 * identity text.
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

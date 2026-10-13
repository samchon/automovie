/** A controlled container refusal after a family candidate was observed. */
export class AutoMovieDesignReferenceContainerError extends Error {
  /** Stable machine-readable diagnostic code. */
  public readonly code =
    "automovie-design-reference-container-invalid" as const;

  public constructor(
    /** Logical design-reference path being inspected. */
    public readonly path: string,
    /** Container family selected by the observed signature or grammar. */
    public readonly family: string,
    /** Stable parser stage at which the candidate was refused. */
    public readonly stage: string,
    detail: string,
  ) {
    super(
      `Design reference "${path}" failed ${family} ${stage} validation: ${detail}`,
    );
    this.name = "AutoMovieDesignReferenceContainerError";
  }
}

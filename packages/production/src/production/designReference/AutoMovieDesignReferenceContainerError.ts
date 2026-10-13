/**
 * Refuse a recognized container candidate with its logical source and stage.
 *
 * Family parsers construct this error through invalidDesignReferenceContainer; inspection callers distinguish malformed supported input from an unrecognized family, which returns null. The detail is parser context, not an admitted fact.
 *
 * @evidence contracts/common.md#principled-implementation An Error subclass keeps stable diagnostic identity and structured path, family and stage beside the explanatory message; recognized malformed containers never become successful metadata.
 * @evidence contracts/common.md#clear-and-simple-design The shared factory normalizes parser details and this class owns the refusal representation consumed by reference inspection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No parser error is reclassified as an unsupported family and no extent is synthesized after a refusal.
 * @evidence contracts/common.md#meaningful-documentation States recognized-candidate semantics, source/stage identity and the distinction from null family selection.
 * @evidence contracts/performance.md#efficient-algorithms Message construction takes space and time proportional to path, family, stage and detail text; native Error stack capture adds runtime-dependent cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each parser refusal is an independent observation and carries no reusable successful result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The throwing caller owns this error and its strings/stack until handled; the class opens no file or task and retains no container bytes directly.
 */
export class AutoMovieDesignReferenceContainerError extends Error {
  /** Stable machine-readable diagnostic code. */
  public readonly code: "automovie-design-reference-container-invalid" =
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

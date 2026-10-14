
/**
 * The exact view one derived artifact was produced under.
 *
 * Every field is required because a missing one is the failure mode this record exists to prevent: a quantity take-off that does not say which alternative it counted, or a render that does not say which phase it depicts, is a number and a picture that cannot be checked against anything.
 *
 * The revision must be the lineage head, a named variant must be based on that revision, a named phase must be declared, and an artifact computed from another artifact must carry the same stamp as its input.
 *
 * @evidence contracts/common.md#principled-implementation `validateDesignLineage` compares the revision with the head, resolves the variant and checks its base equals the revision, resolves the phase, checks the configuration's `sha256:` form, and requires field-by-field equality with every derived input's stamp.
 * @evidence contracts/common.md#clear-and-simple-design Four fields name the revision, alternative, phase, and lowering configuration, the complete set of choices that change a derived output, with null standing for the base design or a phase-independent view.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An artifact stamped with a superseded revision is refused as stale rather than accepted with a warning, and no field is optional, so no reader has to assume a default view.
 * @evidence contracts/common.md#meaningful-documentation States why every field is required, what null means for the variant and the phase, and each consistency rule the stamp must satisfy against the lineage and its inputs.
 * @author Samchon
 */
export interface IAutoMovieDesignStamp {
  /** Revision the artifact was derived from. */
  revision: string;

  /** Variant applied, or null for the base design. */
  variant: string | null;

  /** Phase the artifact depicts, or null when it is phase-independent. */
  phase: string | null;

  /** SHA-256 over the lowering configuration that produced the artifact. */
  configuration: string;
}

/**
 * The exact view one derived artifact was produced under.
 *
 * Every field is required because a missing one is the failure mode this record
 * exists to prevent: a quantity take-off that does not say which alternative it
 * counted, or a render that does not say which phase it depicts, is a number
 * and a picture that cannot be checked against anything.
 *
 * The revision must be the lineage head, a named variant must be based on that
 * revision, a named phase must be declared, and an artifact computed from
 * another artifact must carry the same stamp as its input.
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

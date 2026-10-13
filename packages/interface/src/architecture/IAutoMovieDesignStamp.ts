import { AutoMovieContentDigest } from "../production/AutoMovieContentDigest";

/**
 * The exact view one derived artifact was produced under.
 *
 * Every field is required because a missing one is the failure mode this record
 * exists to prevent: a quantity take-off that does not say which alternative it
 * counted, or a render that does not say which phase it depicts, is a number
 * and a picture that cannot be checked against anything.
 *
 * The revision must be the lineage head, a named variant must be based on that
 * revision, and an artifact computed from another artifact must carry the same
 * stamp as its input.
 *
 * @evidence contracts/common.md#principled-implementation Identifies a view by revision, variant, phase, and configuration digest; `validateDesignLineage` requires the revision to equal `head`, a variant whose base is that revision, a resolving phase, and field-by-field equality with every upstream artifact's stamp.
 * @evidence contracts/common.md#clear-and-simple-design Four required fields with nulls for the base design and phase-independent output; `configuration` is authored and is not compared with `designLineageViewDigest`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No field is optional, as the prose explains; the two nulls are the contract's explicit base-design and phase-independent states rather than missing data.
 * @evidence contracts/common.md#meaningful-documentation States what each field identifies, the null meanings, the head and variant-base rules, and the same-stamp rule between derived inputs.
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
  configuration: AutoMovieContentDigest;
}

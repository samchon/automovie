/**
 * One protected file proven unchanged outside structural evidence comments.
 *
 * @evidence contracts/development/design.md#principled-representation A result pairs a selected path with metadata change status and protected-projection SHA-256.
 * @evidence contracts/development/design.md#minimal-and-owned-surface File evidence is exposed without returning complete retained projections.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The hash describes protected bytes for the selected ownership rather than literary approval.
 * @evidence contracts/development/common.md#meaningful-documentation Properties define path roots, structural metadata change and the hashed representation.
 */
export interface IEvidenceMetadataRewriteFile {
  /** Slash-normalized path relative to both compared roots. */
  file: string;

  /** Whether owned structural metadata changed in this file. */
  metadataChanged: boolean;

  /** SHA-256 of the canonical protected projection. */
  projectionSha256: string;
}

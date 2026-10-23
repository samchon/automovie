/**
 * One protected file proven unchanged outside structural evidence comments.
 *
 * @evidence contracts/common.md#principled-implementation A result pairs a selected path with metadata change status and protected-projection SHA-256.
 * @evidence contracts/common.md#clear-and-simple-design File evidence is exposed without returning complete retained projections.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The hash describes protected bytes for the selected ownership rather than literary approval.
 * @evidence contracts/common.md#meaningful-documentation Properties define path roots, structural metadata change and the hashed representation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased type chooses no runtime algorithm; producing and consuming functions own processing costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased data shape coordinates no work or cache; concrete runtime owners decide value equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased declaration acquires no resources; producers and consumers own concrete value lifetimes.
 */
export interface IEvidenceMetadataRewriteFile {
  /** Slash-normalized path relative to both compared roots. */
  file: string;

  /** Whether owned structural metadata changed in this file. */
  metadataChanged: boolean;

  /** SHA-256 of the canonical protected projection. */
  projectionSha256: string;
}

/**
 * The identity a basis opens with and the SHA-256 of its bytes.
 *
 * @evidence contracts/common.md#principled-implementation Combines a basis opening id read from its prefix with SHA-256 of the actual compressed file bytes.
 * @evidence contracts/common.md#clear-and-simple-design Keeps semantic basis naming separate from byte authority while sharing both with catalogue key and example producers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Prefix id parsing is not full schema/gzip validation, and a digest is byte identity rather than authenticated provenance or physiological admission.
 * @evidence contracts/common.md#meaningful-documentation Specifies id and compressed-byte digest; catalogue tokens may display shortened digest portions without making collisions impossible.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This pair performs no hashing; its readers pay linear byte hashing and bounded compressed-prefix inflation with ratio-dependent output.
 * @evidence contracts/performance.md#reuse-equivalent-work Facts can be reused under their reader's path/stamp authority; equal id alone cannot prove equal compressed basis bytes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The record retains two strings without file handles or numerical geometry; source/sidecar owners retain facts under their own populations.
 *
 * @author Samchon
 */
export interface IHumanViewerBasisIdentity {
  /** The basis `id`. */
  id: string;

  /** Hex SHA-256 of the basis file bytes. */
  digest: string;
}

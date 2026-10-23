/** One protected file proven unchanged outside structural evidence comments. */
export interface IEvidenceMetadataRewriteFile {
  /** Slash-normalized path relative to both compared roots. */
  file: string;

  /** Whether owned structural metadata changed in this file. */
  metadataChanged: boolean;

  /** SHA-256 of the canonical protected projection. */
  projectionSha256: string;
}

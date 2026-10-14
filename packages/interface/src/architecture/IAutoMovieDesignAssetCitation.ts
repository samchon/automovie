
/**
 * The bytes of one imported input, as they stood when an artifact read them.
 *
 * A stamp names the recorded design view; its revision digest is authored rather than rehashed from source. Imported bytes can change independently of source, so a direct input subject's recorded byte digest is repeated here and can disagree after that subject is updated. This detects recorded identity drift rather than proving the artifact actually read those bytes.
 *
 * The record is deliberately a second copy of {@link IAutoMovieDesignSubject}'s digest, as a stamp repeats the revision the work is on: the two disagreeing is the staleness signal. Both copies are authored, so the disagreement appears once the subject's digest is updated to the new bytes; no gate hashes the asset itself against the subject's digest.
 *
 * @evidence contracts/common.md#principled-implementation Detects stale imported bytes by comparing two authored content digests, the one recorded at production time and the subject's current one, so any byte change that reaches the subject's digest is caught without the lineage reading the bytes.
 * @evidence contracts/common.md#clear-and-simple-design Subject id and digest form one direct byte-input citation beside the artifact stamp. Alternatives retain distinct variant fields while fairness compares their configuration/phase; citations remain specific to each artifact's declared direct inputs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The duplicate digest is the signal rather than redundancy to reconcile, and the prose states the remaining gap that no gate hashes the asset bytes against the subject's digest.
 * @evidence contracts/common.md#meaningful-documentation States why imported bytes need their own citation, why the digest is deliberately duplicated, when a disagreement appears, which hashing nobody performs, and that the subject must be an input of the citing artifact.
 * @author Samchon
 */
export interface IAutoMovieDesignAssetCitation {
  /**
   * Declared subject id whose bytes were read; an input of the citing artifact that carries a byte digest, cited at most once per artifact.
   */
  subject: string;

  /** SHA-256 that subject carried at the moment this artifact was produced. */
  digest: string;
}

import { AutoMovieContentDigest } from "../production/AutoMovieContentDigest";

/**
 * The bytes of one imported input, as they stood when an artifact read them.
 *
 * A stamp says which design the artifact was produced from, and the revision
 * digest pins that design exactly. Imported bytes are the one input the
 * revision cannot pin: a texture, a mesh, or a scanned drawing can be replaced
 * without one character of the design moving, and an output baked from the old
 * bytes then goes on looking current. Recording the digest the artifact read
 * turns that into a disagreement validation can detect.
 *
 * The record is deliberately a second copy of {@link IAutoMovieDesignSubject}'s
 * digest, as a stamp repeats the revision the work is on: the two disagreeing
 * is the staleness signal. Both copies are authored, so the disagreement
 * appears once the subject's digest is updated to the new bytes; no gate
 * hashes the asset itself against the subject's digest.
 *
 * @evidence contracts/common.md#principled-implementation Detects stale imported bytes by comparing two authored content digests, the one recorded at production time and the subject's current one, so any byte change that reaches the subject's digest is caught without the lineage reading the bytes.
 * @evidence contracts/common.md#clear-and-simple-design A subject id and a digest are the whole citation, kept on the artifact beside its stamp because bytes belong to one computation while a stamp is shared by compared alternatives.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The duplicate digest is the signal rather than redundancy to reconcile, and the prose states the remaining gap that no gate hashes the asset bytes against the subject's digest.
 * @evidence contracts/common.md#meaningful-documentation States why imported bytes need their own citation, why the digest is deliberately duplicated, when a disagreement appears, which hashing nobody performs, and that the subject must be an input of the citing artifact.
 * @author Samchon
 */
export interface IAutoMovieDesignAssetCitation {
  /**
   * Declared subject id whose bytes were read; an input of the citing artifact
   * that carries a byte digest, cited at most once per artifact.
   */
  subject: string;

  /** SHA-256 that subject carried at the moment this artifact was produced. */
  digest: AutoMovieContentDigest;
}

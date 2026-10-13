import { AutoMovieContentDigest } from "../production/AutoMovieContentDigest";

/**
 * The bytes of one imported input, as they stood when an artifact read them.
 *
 * A stamp says which design the artifact was produced from, and the revision
 * digest pins that design exactly. Imported bytes are the one input the
 * revision cannot pin: a texture, a mesh, or a scanned drawing can be replaced
 * without one character of the design moving, and an output baked from the old
 * bytes then goes on looking current. Recording the digest the artifact
 * actually read is what turns that into a disagreement somebody can detect.
 *
 * The record is deliberately a second copy of {@link IAutoMovieDesignSubject}'s
 * digest, for the same reason a stamp repeats the revision the work is on: the
 * two disagreeing is not the flaw, it is the signal.
 *
 * Both copies are authored. The disagreement appears once the subject's digest
 * is updated to the new bytes; no gate hashes the asset itself against the
 * subject's digest.
 *
 * @evidence contracts/common.md#principled-implementation Pins one imported subject's SHA-256 at production time, so `validateDesignLineage` refuses the artifact as stale once the subject declares different bytes; the comparison is between two authored digests, so replaced bytes go unnoticed until someone updates the subject's digest.
 * @evidence contracts/common.md#clear-and-simple-design Two fields kept outside the stamp, because compared alternatives share a stamp while the bytes read belong to one computation; the duplicated digest is the comparison itself.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Each citation must name an input of its artifact that carries a digest, appear once, and match that subject's current digest, with no exemption for any asset family.
 * @evidence contracts/common.md#meaningful-documentation States whose bytes are cited, when the digest was taken, why the subject digest is deliberately repeated, and that neither copy is checked against the asset bytes.
 * @author Samchon
 */
export interface IAutoMovieDesignAssetCitation {
  /** Declared subject id whose bytes were read; an input of the artifact. */
  subject: string;

  /** SHA-256 that subject carried at the moment this artifact was produced. */
  digest: AutoMovieContentDigest;
}

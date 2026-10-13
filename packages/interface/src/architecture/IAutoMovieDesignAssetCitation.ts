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
 */
export interface IAutoMovieDesignAssetCitation {
  /** Declared subject id whose bytes were read. */
  subject: string;

  /** SHA-256 that subject carried at the moment this artifact was produced. */
  digest: AutoMovieContentDigest;
}

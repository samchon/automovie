import { AutoMovieContentDigest } from "../production/AutoMovieContentDigest";
import { IAutoMovieDesignAssetCitation } from "./IAutoMovieDesignAssetCitation";
import { IAutoMovieDesignStamp } from "./IAutoMovieDesignStamp";

/**
 * One output computed from stable identities under one lineage stamp.
 *
 * A mesh, a finish cut, a schedule line, an analysis result, and a render frame
 * are all the same kind of thing here: something that stops being true when one
 * of its inputs moves. Declaring the inputs is what lets a change name exactly
 * what it invalidated instead of everything.
 */
export interface IAutoMovieDerivedArtifact {
  /** Stable artifact identity, distinct from every declared subject id. */
  id: string;

  /** Open output family such as `mesh`, `cut`, `quantity`, or `render`. */
  kind: string;

  /** Subject or artifact ids this output was computed from; at least one. */
  inputs: string[];

  /**
   * The imported bytes it read: exactly one citation per input carrying any.
   *
   * This sits beside the stamp rather than inside it because the two answer
   * different questions. A stamp is the view, and two alternatives being
   * compared share one; the bytes are this computation's own, and an output
   * derived only from authored identities cites none at all.
   */
  assets: IAutoMovieDesignAssetCitation[];

  /** The view it was computed under. */
  stamp: IAutoMovieDesignStamp;

  /** SHA-256 of the output's own bytes. */
  digest: AutoMovieContentDigest;
}

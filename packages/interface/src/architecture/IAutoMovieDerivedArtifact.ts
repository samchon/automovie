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
 *
 * Artifacts and their inputs form an acyclic graph. An artifact is refused as
 * stale when its stamp is not on the lineage head, when an input artifact was
 * computed under a different stamp, or when a cited byte digest differs from
 * the subject's current one.
 *
 * @author Samchon
 */
export interface IAutoMovieDerivedArtifact {
  /**
   * Stable artifact identity, distinct from every declared subject id and from
   * every identity the production's buildings, models, and asset uses publish.
   */
  id: string;

  /** Open output family such as `mesh`, `cut`, `quantity`, or `render`. */
  kind: string;

  /**
   * Subject or artifact ids this output was computed from; at least one,
   * distinct, each resolving within the lineage.
   */
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

  /** The view it was computed under; its revision must be the lineage head. */
  stamp: IAutoMovieDesignStamp;

  /**
   * SHA-256 of the output's own bytes, as the author recorded it; validation
   * checks only its `sha256:` form and never rehashes the output.
   */
  digest: AutoMovieContentDigest;
}

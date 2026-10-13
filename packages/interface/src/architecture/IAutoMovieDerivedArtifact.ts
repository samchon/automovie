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
 * @evidence contracts/common.md#principled-implementation Records an output as a node of a derivation graph with declared inputs, its stamp, its own digest, and one byte citation per imported input; `validateDesignLineage` refuses input cycles, a stamp off `head`, an input artifact under a different stamp, and a citation that disagrees with its subject's digest.
 * @evidence contracts/common.md#clear-and-simple-design Byte citations sit beside the stamp because the stamp is a view shared by compared alternatives while the bytes belong to this computation; `kind` is an open string read only by the fairness rule between alternatives of one decision.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No output family is special-cased; same-kind artifacts across one decision's options must share configuration and phase, and `digest` is authored and never recomputed from the output bytes by any validator.
 * @evidence contracts/common.md#meaningful-documentation States the id's distinctness from subjects, the at-least-one input rule, the exactly-one-citation rule and why citations are separate, the staleness refusals, and that the output digest is author-recorded.
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

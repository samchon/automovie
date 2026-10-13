import { AutoMovieContentDigest } from "../production/AutoMovieContentDigest";
import { IAutoMovieDesignAssetCitation } from "./IAutoMovieDesignAssetCitation";
import { IAutoMovieDesignStamp } from "./IAutoMovieDesignStamp";

/**
 * One output computed from stable identities under one lineage stamp.
 *
 * A mesh, a finish cut, a schedule line, an analysis result, and a render frame
 * are all the same kind of thing here: something that stops being true when one
 * of its inputs moves. Declaring the inputs lets a change name exactly what it
 * invalidated instead of everything.
 *
 * Artifacts and their inputs form an acyclic graph. Validation refuses an
 * artifact as stale when its stamp is not on the lineage head, when an input
 * artifact was computed under a different stamp, or when a cited byte digest
 * differs from the subject's current one.
 *
 * @evidence contracts/common.md#principled-implementation Staleness is decided by identity comparison on a declared dependency graph: the stamp's revision against the lineage head, each input artifact's full stamp against this one, and each cited byte digest against the subject's current digest, with a depth-first walk refusing any cycle.
 * @evidence contracts/common.md#clear-and-simple-design Inputs, byte citations, the stamp, and the output digest are four separate members because each answers a different staleness question, and `designLineageImpact` reads only `inputs` to walk the graph backwards.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The output digest is checked only for its `sha256:` form and never rehashed, which the member states as a limit, and an imported input without a citation is refused rather than treated as unchanged.
 * @evidence contracts/common.md#meaningful-documentation States the acyclicity and staleness rules, the id collision rules against subjects and published identities, the at-least-one and distinct input rules, the one-citation-per-imported-input rule, the head requirement on the stamp, and what validation checks of the digest.
 * @author Samchon
 */
export interface IAutoMovieDerivedArtifact {
  /**
   * Stable artifact identity, unique among derived artifacts and distinct from
   * every declared subject id and from every identity the production's
   * buildings, models, and asset uses publish.
   */
  id: string;

  /**
   * Non-blank open output family such as `mesh`, `cut`, `quantity`, or
   * `render`.
   */
  kind: string;

  /**
   * Subject or artifact ids this output was computed from; at least one,
   * distinct, each resolving within the lineage.
   */
  inputs: string[];

  /**
   * The imported bytes it read: exactly one citation for each input whose
   * subject carries a byte digest, and none for any other.
   *
   * This sits beside the stamp rather than inside it because the two answer
   * different questions. A stamp is the view, and two alternatives being
   * compared share one; the bytes are this computation's own, and an output
   * derived only from authored identities cites none at all.
   */
  assets: IAutoMovieDesignAssetCitation[];

  /**
   * The view it was computed under; its revision must be the lineage head, its
   * variant must apply to that revision, and its phase must resolve.
   */
  stamp: IAutoMovieDesignStamp;

  /**
   * SHA-256 of the output's own bytes, as the author recorded it; validation
   * checks only its lowercase `sha256:` hex form and never rehashes the output.
   */
  digest: AutoMovieContentDigest;
}

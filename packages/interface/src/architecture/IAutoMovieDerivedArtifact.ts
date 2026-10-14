import { IAutoMovieDesignAssetCitation } from "./IAutoMovieDesignAssetCitation";
import { IAutoMovieDesignStamp } from "./IAutoMovieDesignStamp";

/**
 * One output computed from stable identities under one lineage stamp.
 *
 * A mesh, a finish cut, a schedule line, an analysis result, and a render frame are all the same kind of thing here: something that stops being true when one of its inputs moves. Declaring the inputs lets a change name exactly what it invalidated instead of everything.
 *
 * Artifacts and their inputs form an acyclic graph. Validation refuses an artifact as stale when its stamp is not on the lineage head, when an input artifact was computed under a different stamp, or when a cited byte digest differs from the subject's current one.
 *
 * @evidence contracts/common.md#principled-implementation Admission compares recorded head/variant/phase/configuration, full upstream artifact stamps and citations against directly named input subjects' authored digests, then checks graph cycles. Freshness is conditional on complete honest dependency recording: upstream artifact digest changes with an unchanged stamp are not compared, and no output or input file is rehashed by this gate.
 * @evidence contracts/common.md#clear-and-simple-design Inputs, byte citations, the stamp, and the output digest are four separate members because each answers a different staleness question, and `designLineageImpact` reads only `inputs` to walk the graph backwards.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Output/configuration digest spelling is not byte verification. Every direct input subject carrying a digest requires one matching citation; authored/null-digest subjects and upstream artifacts use the separate stamp rule. Fairness compares phase/configuration among all same-kind artifacts associated with a decision's options, including multiple artifacts of one option, rather than proving their pictures or quantities were generated under equivalent actual conditions.
 * @evidence contracts/common.md#meaningful-documentation States the acyclicity and staleness rules, the id collision rules against subjects and published identities, the at-least-one and distinct input rules, the one-citation-per-imported-input rule, the head requirement on the stamp, and what validation checks of the digest.
 * @author Samchon
 */
export interface IAutoMovieDerivedArtifact {
  /**
   * Stable artifact identity, unique among derived artifacts and distinct from every declared subject id and from every identity the production's buildings, models, and asset uses publish.
   */
  id: string;

  /**
   * Non-blank open output family such as `mesh`, `cut`, `quantity`, or `render`.
   */
  kind: string;

  /**
   * Subject or artifact ids this output was computed from; at least one, distinct, each resolving within the lineage.
   */
  inputs: string[];

  /**
   * The imported bytes it read: exactly one citation for each input whose subject carries a byte digest, and none for any other.
   *
   * Citations sit beside the stamp because they describe this computation's direct byte inputs. Compared alternatives normally have different variant fields; their same-kind artifacts must share recorded configuration and phase. An output whose direct subject inputs all carry null digests cites no imported bytes, while upstream artifacts are checked through stamp equality.
   */
  assets: IAutoMovieDesignAssetCitation[];

  /**
   * The view it was computed under; its revision must be the lineage head, its variant must apply to that revision, and its phase must resolve.
   */
  stamp: IAutoMovieDesignStamp;

  /**
   * SHA-256 of the output's own bytes, as the author recorded it; validation checks only its lowercase `sha256:` hex form and never rehashes the output.
   */
  digest: string;
}

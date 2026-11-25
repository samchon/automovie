import type { IAutoMovieDesignAssetCitation } from "./IAutoMovieDesignAssetCitation";
import type { IAutoMovieDesignStamp } from "./IAutoMovieDesignStamp";

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
   * Citations sit beside the stamp because they describe this computation's
   * direct byte inputs. Compared alternatives normally have different variant
   * fields; their same-kind artifacts must share recorded configuration and
   * phase. An output whose direct subject inputs all carry null digests cites
   * no imported bytes, while upstream artifacts are checked through stamp
   * equality.
   */
  assets: IAutoMovieDesignAssetCitation[];

  /**
   * The view it was computed under; its revision must be the lineage head, its
   * variant must apply to that revision, and its phase must resolve.
   */
  stamp: IAutoMovieDesignStamp;

  /**
   * SHA-256 of the output's own bytes, as the author recorded it; validation
   * checks only its lowercase `sha256:` hex form and never rehashes the
   * output.
   */
  digest: string;
}

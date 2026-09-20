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
 * @evidence requirements/evidence-and-provenance/entities-activities-agents-and-lineage.md#provenance-lineage-gaps Exposes `IAutoMovieDerivedArtifact` as the portable data boundary for the provenance lineage gaps requirement.
 * @evidence specifications/evidence-and-provenance/entities-activities-agents-and-lineage.md#evp-lineage-gap-representation Types `IAutoMovieDerivedArtifact` for the evp lineage gap representation system contract.
 */
export interface IAutoMovieDerivedArtifact {
  /**
   * Stable artifact identity, distinct from every declared subject id.
   *
   * @evidence requirements/evidence-and-provenance/entities-activities-agents-and-lineage.md#provenance-lineage-gaps Exposes `id` as the portable data boundary for the provenance lineage gaps requirement.
   * @evidence specifications/evidence-and-provenance/entities-activities-agents-and-lineage.md#evp-lineage-gap-representation Types `id` for the evp lineage gap representation system contract.
   */
  id: string;

  /**
   * Open output family such as `mesh`, `cut`, `quantity`, or `render`.
   *
   * @evidence requirements/evidence-and-provenance/entities-activities-agents-and-lineage.md#provenance-lineage-gaps Exposes `kind` as the portable data boundary for the provenance lineage gaps requirement.
   * @evidence specifications/evidence-and-provenance/entities-activities-agents-and-lineage.md#evp-lineage-gap-representation Types `kind` for the evp lineage gap representation system contract.
   */
  kind: string;

  /**
   * Subject or artifact ids this output was computed from; at least one.
   *
   * @evidence requirements/evidence-and-provenance/entities-activities-agents-and-lineage.md#provenance-lineage-gaps Exposes `inputs` as the portable data boundary for the provenance lineage gaps requirement.
   * @evidence specifications/evidence-and-provenance/entities-activities-agents-and-lineage.md#evp-lineage-gap-representation Types `inputs` for the evp lineage gap representation system contract.
   */
  inputs: string[];

  /**
   * The imported bytes it read: exactly one citation per input carrying any.
   *
   * This sits beside the stamp rather than inside it because the two answer
   * different questions. A stamp is the view, and two alternatives being
   * compared share one; the bytes are this computation's own, and an output
   * derived only from authored identities cites none at all.
   *
   * @evidence requirements/evidence-and-provenance/entities-activities-agents-and-lineage.md#provenance-lineage-gaps Exposes `assets` as the portable data boundary for the provenance lineage gaps requirement.
   * @evidence specifications/evidence-and-provenance/entities-activities-agents-and-lineage.md#evp-lineage-gap-representation Types `assets` for the evp lineage gap representation system contract.
   */
  assets: IAutoMovieDesignAssetCitation[];

  /**
   * The view it was computed under.
   *
   * @evidence requirements/evidence-and-provenance/entities-activities-agents-and-lineage.md#provenance-lineage-gaps Exposes `stamp` as the portable data boundary for the provenance lineage gaps requirement.
   * @evidence specifications/evidence-and-provenance/entities-activities-agents-and-lineage.md#evp-lineage-gap-representation Types `stamp` for the evp lineage gap representation system contract.
   */
  stamp: IAutoMovieDesignStamp;

  /**
   * SHA-256 of the output's own bytes.
   *
   * @evidence requirements/evidence-and-provenance/entities-activities-agents-and-lineage.md#provenance-lineage-gaps Exposes `digest` as the portable data boundary for the provenance lineage gaps requirement.
   * @evidence specifications/evidence-and-provenance/entities-activities-agents-and-lineage.md#evp-lineage-gap-representation Types `digest` for the evp lineage gap representation system contract.
   */
  digest: AutoMovieContentDigest;
}

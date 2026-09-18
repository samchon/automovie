import { AutoMovieContentDigest } from "../production/AutoMovieContentDigest";

/**
 * One stable identity this lineage is allowed to speak about.
 *
 * Lineage deliberately imports none of the graphs it annotates. It attaches to
 * a bare id and the open name of the graph that id came from, so an element, a
 * logical space, an opening, a material layer, a service port, an instance
 * slot, or a fold that does not exist yet can all be phased, varied, and
 * impact-traced without this record gaining a field. Registering an identity
 * here is the whole act of opting a graph into lineage.
 *
 * @evidence requirements/evidence-and-provenance/entities-activities-agents-and-lineage.md#provenance-lineage-gaps Exposes `IAutoMovieDesignSubject` as the portable data boundary for the provenance lineage gaps requirement.
 * @evidence specifications/evidence-and-provenance/entities-activities-agents-and-lineage.md#evp-lineage-gap-representation Types `IAutoMovieDesignSubject` for the evp lineage gap representation system contract.
 */
export interface IAutoMovieDesignSubject {
  /**
   * Stable id of one record in some other graph.
   *
   * @evidence requirements/evidence-and-provenance/entities-activities-agents-and-lineage.md#provenance-lineage-gaps Exposes `id` as the portable data boundary for the provenance lineage gaps requirement.
   * @evidence specifications/evidence-and-provenance/entities-activities-agents-and-lineage.md#evp-lineage-gap-representation Types `id` for the evp lineage gap representation system contract.
   */
  id: string;

  /**
   * Open name of the graph the id belongs to, such as `element`, `space`,
   * `opening`, `material-layer`, `service-port`, `instance-slot`, or `asset`.
   *
   * @evidence requirements/evidence-and-provenance/entities-activities-agents-and-lineage.md#provenance-lineage-gaps Exposes `graph` as the portable data boundary for the provenance lineage gaps requirement.
   * @evidence specifications/evidence-and-provenance/entities-activities-agents-and-lineage.md#evp-lineage-gap-representation Types `graph` for the evp lineage gap representation system contract.
   */
  graph: string;

  /**
   * SHA-256 of the bytes this identity stands for, or null when the identity is
   * authored source rather than bytes.
   *
   * An imported texture, mesh, or drawing is an input whose content can change
   * without one character of the design changing, so a derived artifact that
   * cites it has to cite its bytes too; that is what
   * {@link IAutoMovieDesignAssetCitation} is for. Authored subjects carry null
   * because their content is the revision's own digest, and repeating it here
   * would be a second copy free to disagree with the first.
   *
   * @evidence requirements/evidence-and-provenance/entities-activities-agents-and-lineage.md#provenance-lineage-gaps Exposes `digest` as the portable data boundary for the provenance lineage gaps requirement.
   * @evidence specifications/evidence-and-provenance/entities-activities-agents-and-lineage.md#evp-lineage-gap-representation Types `digest` for the evp lineage gap representation system contract.
   */
  digest: AutoMovieContentDigest | null;
}

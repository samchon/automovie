/**
 * One stable identity this lineage is allowed to speak about.
 *
 * Lineage deliberately imports none of the graphs it annotates. It attaches to a bare id and the open name of the graph that id came from, so an element, a logical space, an opening, a material layer, a service port, an instance slot, or a fold that does not exist yet can all be phased, varied, and impact-traced without this record gaining a field. Registering an identity here is the whole act of opting a graph into lineage.
 *
 * When the production builds, every subject id must be one it publishes: the id of a building, element, logical space, boundary, opening, or connector of a compiled built environment, of a staged model, or of an asset use's consumer in this production. A graph whose ids the builder does not publish yet, such as a material layer, cannot bind until it does.
 *
 * @evidence contracts/common.md#principled-implementation Coherence requires unique nonblank subject id, nonblank graph name and null or digest spelling. Binding is exact id-set membership in published building-unit/element/space/boundary/opening/connector ids, compiled model ids and current production asset-use consumer ids. Graph labels are not matched to a typed publisher, so membership does not establish source family, unique cross-graph ownership or byte provenance; build review performs binding outside design-only scope when compiled shots exist.
 * @evidence contracts/common.md#clear-and-simple-design An id plus an open graph name is the whole coupling, so a new graph opts into lineage by publishing ids rather than by widening this type or importing the lineage module.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unpublished ids are refused at build rather than ignored; the remaining gap is that an imported subject's digest is authored and not compared with the asset manifest, which the `digest` documentation states.
 * @evidence contracts/common.md#meaningful-documentation States why the record is graph-agnostic, exactly which published ids a subject may bind to, when a digest is required and when it must be null, and that the digest is unverified against the manifest.
 * @author Samchon
 */
export interface IAutoMovieDesignSubject {
  /** Stable id of one record in some other graph, unique within the lineage. */
  id: string;

  /**
   * Non-blank open name of the graph the id belongs to, such as `element`, `space`, `opening`, `material-layer`, `service-port`, `instance-slot`, or `asset`.
   */
  graph: string;

  /**
   * SHA-256 of the bytes this identity stands for, or null when the identity is authored source rather than bytes.
   *
   * An imported texture, mesh, or drawing is an input whose content can change without one character of the design changing, so a derived artifact that cites it has to cite its bytes too; that is what {@link IAutoMovieDesignAssetCitation} is for. Authored subjects carry null because their content is the revision's own digest, and repeating it here would be a second copy free to disagree with the first.
   *
   * The value is authored; no gate checks it against the asset manifest's digest for the same bytes.
   */
  digest: string | null;
}

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
 * When the production builds, every subject id must be one its buildings,
 * models, or asset-use consumers publish.
 *
 * @evidence contracts/common.md#principled-implementation Attaches lineage to a bare id plus an open graph name so any graph opts in without this record changing; `validateDesignLineageBinding` refuses an id the production does not publish, but no gate compares `digest` with the asset ledger's digest of the same bytes.
 * @evidence contracts/common.md#clear-and-simple-design Three fields; the digest is null for authored subjects so the revision digest stays the only copy of their content, as the member prose explains.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No graph name is interpreted beyond being non-blank, and the digest is only checked for its `sha256:` form; the missing ledger comparison is a stated gap rather than a compensated one.
 * @evidence contracts/common.md#meaningful-documentation States what the id refers to, the open graph vocabulary, when the digest is null and why, that ids are bound at production build, and that the digest is never checked against the ledger.
 * @author Samchon
 */
export interface IAutoMovieDesignSubject {
  /** Stable id of one record in some other graph. */
  id: string;

  /**
   * Open name of the graph the id belongs to, such as `element`, `space`,
   * `opening`, `material-layer`, `service-port`, `instance-slot`, or `asset`.
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
   * The value is authored; no gate checks it against the asset manifest's
   * digest for the same bytes.
   */
  digest: AutoMovieContentDigest | null;
}

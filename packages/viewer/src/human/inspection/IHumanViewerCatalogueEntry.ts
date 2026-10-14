/**
 * One numerical document descriptor used by the server's catalogue offers and published `/docs` entries. Input and authored offers can carry this shape before owner admission, so its presence alone does not make a document drawable. The projection reads identity, domain, basis names and cache-key inputs; the face, body or person owner admits the complete document. Shared human types participate in server and browser checking without moving domain schema admission into this transport shape.
 *
 * @evidence contracts/common.md#principled-implementation Projects document identity, numerical domain, basis token and content key while leaving document JSON for its actual domain-owner admission.
 * @evidence contracts/common.md#clear-and-simple-design One wire entry joins source identity with unexamined numerical input without importing geometry builders into catalogue construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Token display uses shortened digest portions and is not an impossible-collision guarantee; actual basis serving verifies its owner token and schema admission is separate.
 * @evidence contracts/common.md#meaningful-documentation Documents supported published/candidate basis forms, cache-key dependencies and unknown document semantics; drawing success cannot repair a refused document.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The entry performs no hashing; catalogue/key owners hash document/source/basis facts and numerical owners pay construction cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Cache reuse requires actual document, basis and builder dependencies, with AO suffix where the transport applies it; id/domain equality is insufficient.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Inventory owns document snapshots until replacement, while workers and GPU residents have separate lifetimes; the entry acquires neither.
 *
 * @author Samchon
 */
export interface IHumanViewerCatalogueEntry {
  /**
   * Document id, `file:<name>` or `file:<name>/<id>` for hand-written inputs.
   */
  id: string;

  /**
   * Content digest of document, basis and builder source; the numerical cache key.
   */
  key: string;

  /**
   * Basis selection and twelve-hex digest prefixes requested by the worker and checked by the server: `published@<digest12>` (published face or body), `published@<face12>.<body12>` (a person on both published bases), `published-generation@<head12>.<body12>` (the published one-skin person generation), `<name>@<digest12>` (a candidate basis or person packet), or `candidate-generation:<name>@<head12>.<body12>` (candidate typed views). The worker also supports `published-generation-body@<body12>` for a published generation's body view, though current catalogue producers do not emit that form. A colliding prefix can accept changed bytes; this token is not complete byte-identity proof.
   */
  basis: string;

  /** Numerical domain that builds the document. */
  domain: "face" | "body" | "person";

  /** The document JSON, admitted by its domain owner when built. */
  document: unknown;
}

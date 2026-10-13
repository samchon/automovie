/**
 * One displayable document as the server publishes it at `/docs`. The server
 * reads only what the catalogue needs (identity, domain, basis names and the
 * cache key) and keeps the document itself as unexamined JSON: its schema is
 * admitted where it is built, by the face, body or person owner in the page's
 * numerical worker, whose refusal reaches the render. Shared human types
 * participate in the owning server and browser check without moving domain
 * schema admission into the server's catalogue projection.
 *
 * @evidence contracts/common.md#principled-implementation Leaves schema admission with the domain owner and keeps only catalogue identity on the server.
 * @evidence contracts/common.md#clear-and-simple-design One wire record serves server publication; the page's typed view narrows it.
 * @evidence contracts/common.md#meaningful-documentation States what the server examines and who admits the rest.
 *
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Digest-bearing basis tokens identify the actual source generation; the server never derives acceptance from a document name.
 *
 * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Leaves schema admission with the domain owner and keeps only catalogue identity on the server.
 * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Digest-bearing basis tokens identify the actual source generation; the server never derives acceptance from a document name.
 *
 * @author Samchon
 */
export interface IHumanViewerCatalogueEntry {
  /**
   * Document id, `file:<name>` or `file:<name>/<id>` for hand-written inputs.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Provides stable document selection independently of its display label or current cache generation.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Provides stable document selection independently of its display label or current cache generation.
   */
  id: string;

  /**
   * Content digest of document, basis and builder source; the numerical cache key.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Binds numerical reuse to the original document, basis bytes and actual producer source.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Binds numerical reuse to the original document, basis bytes and actual producer source.
   */
  key: string;

  /**
   * The exact basis bytes the document is built on, which the worker requests
   * and the server verifies: `published@<digest12>` (published face or body),
   * `published@<face12>.<body12>` (a person on both published bases),
   * `published-generation@<head12>.<body12>` (the published one-skin person
   * generation), `<name>@<digest12>` (a candidate basis or person packet),
   * or `candidate-generation:<name>@<head12>.<body12>` (candidate typed views).
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Names the exact digest-bearing basis or Person view pair requested and checked by the numerical owner.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Names the exact digest-bearing basis or Person view pair requested and checked by the numerical owner.
   */
  basis: string;

  /**
   * Numerical domain that builds the document.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Selects the existing Face, Body or Person admission/runtime without inferring it from a subject name.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Selects the existing Face, Body or Person admission/runtime without inferring it from a subject name.
   */
  domain: "face" | "body" | "person";

  /**
   * The document JSON, admitted by its domain owner when built.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Retains external JSON as unexamined data until its actual domain owner admits it.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Retains external JSON as unexamined data until its actual domain owner admits it.
   */
  document: unknown;
}

/**
 * One displayable document as the server publishes it at `/docs`. The server
 * reads only what the catalogue needs (identity, domain, basis names and the
 * cache key) and keeps the document itself as unexamined JSON: its schema is
 * admitted where it is built, by the face, body or person owner in the page's
 * numerical worker, whose refusal reaches the render. Keeping the human
 * package's types out of the server also keeps its type check out of every
 * server start.
 *
 * @evidence contracts/common.md#principled-implementation Leaves schema admission with the domain owner and keeps only catalogue identity on the server.
 * @evidence contracts/common.md#clear-and-simple-design One wire record serves server publication; the page's typed view narrows it.
 * @evidence contracts/common.md#meaningful-documentation States what the server examines and who admits the rest.
 * @author Samchon
 */
export interface IHumanViewerCatalogueEntry {
  /** Document id, `file:<name>` or `file:<name>/<id>` for hand-written inputs. */
  id: string;

  /** Content digest of document, basis and builder source; the numerical cache key. */
  key: string;

  /** `<name>@<digest12>` of the candidate basis or packet it is built on, absent for published bases. */
  basis?: string;

  /** Numerical domain that builds the document. */
  domain: "face" | "body" | "person";

  /** The document JSON, admitted by its domain owner when built. */
  document: unknown;
}

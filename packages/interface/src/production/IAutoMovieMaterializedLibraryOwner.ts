import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/**
 * What one design owner's executed source published on this compile.
 *
 * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Records which source export and revision each library artifact came from.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types the per-owner derived state one executed source export produced.
 * @author Samchon
 */
export interface IAutoMovieMaterializedLibraryOwner {
  /** Active manifest-derived design branch. */
  branch: string;
  /** Exact design-document and H2 address the artifacts realize. */
  owner: string;
  /** Project-relative source file whose export produced them. */
  source: string;
  /** Named export inside that file. */
  export: string;
  /** Digest of the normalized source bytes that were executed. */
  sourceDigest: AutoMovieContentDigest;
  /** Ids of the built environments this owner published, in code-unit order. */
  environments: string[];
  /** Ids of the models this owner published, in code-unit order. */
  models: string[];
  /**
   * Ids of the environment contexts this owner published, in code-unit order.
   *
   * Optional for the reader's sake, not the writer's. Every compile writes it,
   * so a current index always carries it; but the index is validated exactly,
   * and an index written before this field existed would fail that validation
   * as a whole -- taking the environments down with it and handing
   * `building:report` and `library:review` an empty population, silently, which
   * is the exact failure this field was added to end.
   */
  contexts?: string[];
}

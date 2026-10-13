import { AutoMovieContentDigest } from "../production/AutoMovieContentDigest";

/**
 * One immutable state of the authored design source.
 *
 * The digest is authored: validation checks its `sha256:` form, and nothing
 * hashes the source to confirm it. Several revisions may have a null parent,
 * and a revision names at most one parent, so a merge of two revisions is not
 * representable.
 *
 * @evidence contracts/common.md#principled-implementation A revision is an id, an optional parent, and a SHA-256 of the authored source; `validateDesignLineage` requires the parent to resolve, the parent links to be acyclic, and the digest to be `sha256:` plus 64 lowercase hex digits, but never recomputes it from the source.
 * @evidence contracts/common.md#clear-and-simple-design Three fields and one parent link; branching is expressed by variants over a base revision rather than by revision merges.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A null parent is the contract's first-revision state; several roots are accepted because only unresolved and cyclic parents are refused, and no revision id is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the identity scope, the null-parent meaning, what the digest covers and that it is only format-checked, and the single-parent limit.
 * @author Samchon
 */
export interface IAutoMovieDesignRevision {
  /** Stable revision identity within the lineage. */
  id: string;

  /** Revision this one supersedes, or null for the first. */
  parent: string | null;

  /** SHA-256 over the authored source this revision names. */
  digest: AutoMovieContentDigest;
}

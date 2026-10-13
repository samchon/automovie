import { IAutoMovieVisualRevisionView } from "./IAutoMovieVisualRevisionView";

/**
 * One named visual catalog at one production revision.
 *
 * @evidence contracts/common.md#principled-implementation A trimmed nonblank revision and catalog identify a supplied population of unique subject/view image digests; comparison validates identities and byte-digest syntax independently of input ordering.
 * @evidence contracts/common.md#clear-and-simple-design A compact snapshot carries existing visual identities rather than images or renderer state, allowing byte-change reporting without another rendering phase.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Snapshot admission does not prove that supplied digests match resident images or current captures; duplicate keys and mismatched catalogs refuse rather than overwriting or comparing partially.
 * @evidence contracts/common.md#meaningful-documentation Defines catalog and revision identity, arbitrary input order and unique subject/view record population with caller-owned evidence.
 * @author Samchon
 */
export interface IAutoMovieVisualRevisionSnapshot {
  /** Non-blank production or compile revision identity. */
  revision: string;

  /** Non-blank identity of the observation population. */
  catalog: string;

  /** Unique subject-view records in arbitrary input order. */
  views: IAutoMovieVisualRevisionView[];
}

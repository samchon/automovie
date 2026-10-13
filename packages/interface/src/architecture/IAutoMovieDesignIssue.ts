/**
 * Something still undecided about a reference, and what it blocks.
 *
 * An open issue blocks a candidate's promotion only when that candidate lists
 * the issue's id in its own `issues`. Naming a primitive or candidate in
 * {@link subjects} blocks nothing by itself, and validation does not require
 * the two directions to agree.
 *
 * @author Samchon
 */
export interface IAutoMovieDesignIssue {
  /** Stable issue identity within the document. */
  id: string;

  /** Closed reason family that keeps a reading unsettled. */
  kind:
    | "unknown-scale"
    | "ambiguous-geometry"
    | "occluded"
    | "illegible"
    | "conflicting-dimension"
    | "other";

  /** Primitive or candidate ids this issue is about; at least one, distinct. */
  subjects: string[];

  /** What a human still has to decide. */
  detail: string;

  /** Whether the issue is still open; only an open issue blocks promotion. */
  open: boolean;
}

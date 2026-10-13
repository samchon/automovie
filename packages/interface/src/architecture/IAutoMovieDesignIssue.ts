/**
 * Something still undecided about a reference, and what it blocks.
 *
 * An open issue blocks a candidate's promotion only when that candidate lists
 * the issue's id in its own `issues`. Naming a primitive or candidate in
 * {@link subjects} blocks nothing by itself, and validation does not require
 * the two directions to agree.
 *
 * @evidence contracts/common.md#principled-implementation Records an unsettled reading as a closed kind, distinct resolving primitive or candidate ids, a detail, and an open flag; `promoteDesignObservations` consults only `open` and the candidate-side back reference, so an open issue whose subjects name a candidate that does not list it back fails to block that candidate.
 * @evidence contracts/common.md#clear-and-simple-design Five fields; the kind classifies the doubt for a reader and does not change promotion, which reacts only to the open flag.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The six kinds come from the contract's `AUTO_MOVIE_DESIGN_ISSUE_KINDS` list; the one-directional blocking is a defect stated here rather than compensated for by any reader.
 * @evidence contracts/common.md#meaningful-documentation States the id scope, the closed kinds, the subject floor and distinctness, the human decision text, the open state, and exactly which link blocks promotion.
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

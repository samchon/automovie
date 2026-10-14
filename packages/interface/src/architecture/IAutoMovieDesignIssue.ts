/**
 * Something still undecided about a reference, and what it blocks.
 *
 * An open issue blocks a candidate's promotion only when that candidate lists
 * the issue's id in its own `issues`. Naming a primitive or candidate in
 * {@link subjects} blocks nothing by itself, and validation does not require
 * the two directions to agree.
 *
 * @evidence contracts/common.md#principled-implementation `validateDesignReference` requires a known kind, a non-blank detail, and at least one distinct subject resolving to a primitive or candidate of the same document; `promoteDesignObservations` collects the ids of open issues and withholds a candidate whose own `issues` names one.
 * @evidence contracts/common.md#clear-and-simple-design The blocking relation lives once, on the candidate's `issues` list, so `subjects` only scopes the question for a reader and no second link has to be kept in sync with the first.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Blocking is not inferred from subjects or reconciled reciprocally. The caller's open flag and the candidate's issue list alone decide this gate; the engine does not authenticate who closed an issue or whether its uncertainty was resolved. Removing a candidate link or clearing open removes that specific block without settling other promotion gates.
 * @evidence contracts/common.md#meaningful-documentation States that only an open issue a candidate lists blocks it, that naming a subject blocks nothing, what each subject must resolve to, and that the detail is the decision a human still owes.
 * @author Samchon
 */
export interface IAutoMovieDesignIssue {
  /** Stable, non-blank issue identity, unique within the document. */
  id: string;

  /** Closed reason family that keeps a reading unsettled. */
  kind:
    | "unknown-scale"
    | "ambiguous-geometry"
    | "occluded"
    | "illegible"
    | "conflicting-dimension"
    | "other";

  /**
   * Primitive or candidate ids of the same document this issue is about; at
   * least one, each resolving and listed once.
   */
  subjects: string[];

  /** Non-blank statement of what a human still has to decide. */
  detail: string;

  /** Whether the issue is still open; only an open issue blocks promotion. */
  open: boolean;
}

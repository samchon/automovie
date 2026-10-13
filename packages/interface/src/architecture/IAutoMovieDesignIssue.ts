/** Something still undecided about a reference, and what it blocks. */
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

  /** Whether the issue is still open. */
  open: boolean;
}

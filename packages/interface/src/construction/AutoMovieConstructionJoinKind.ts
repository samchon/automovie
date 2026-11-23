/**
 * The kind of a join: `merge` keeps the part outside the host and the host
 * outside the part (their union), `diff` keeps the part inside the host and the
 * host outside the part (the part cut from the host, its kept wall the recess's
 * lining).
 */
export type AutoMovieConstructionJoinKind = "merge" | "diff";

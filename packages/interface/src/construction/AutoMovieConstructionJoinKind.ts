/**
 * The kind of a join: `merge` keeps the part outside the host and the host outside the part (their union), `diff` keeps the part inside the host and the host outside the part (the part cut from the host, its kept wall the recess's lining).
 *
 * @evidence contracts/development/design.md#principled-representation The union and the difference of two solids differ only in which side of the host the part keeps.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two closed values select the kept sides of one join operator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A cut that passes through the host's wall is a trim, not a diff, since nothing lies behind it to blend to.
 * @evidence contracts/development/common.md#meaningful-documentation States each value's kept sides and the boundary with the trim.
 */
export type AutoMovieConstructionJoinKind = "merge" | "diff";

# src/audit/AutoMovieMotionHumanAuditPartner.ts#AutoMovieMotionHumanAuditPartner.measure

## @evidence contracts/development/common.md#meaningful-documentation

States each input, the result and the certified reading that gives it.

## @evidence contracts/development/implementation.md#principled-implementation

Both directions at every instant of the grid, by conservative advancement: a pair is left unread only at instants where its depth cannot exceed its record (or the nanometre a first record needs), its margin and its segments' travel measured on the film's own poses.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Place both people at every instant and measure their travel, then a grid loop over two directed readings of the pairs that are due, and one sort.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads both ends of the film and exempts nothing; no pair is sampled.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each person's bones are posed and placed once per instant and shared by both directions; G instants and S, T parts cost O(G*(S+T)) placement and travel, O(G*S*T) sphere screens, and a depth reading only for a pair that is due.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The grid is `AutoMovieMotionHumanAuditMotion.grid`, the pose reading and the bounds `AutoMovieMotionHumanAuditTangleMargin`'s.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds both people's placements, travel and due indices for the call and releases them with it; only the result survives.

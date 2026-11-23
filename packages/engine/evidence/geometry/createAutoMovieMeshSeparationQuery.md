# src/geometry/createAutoMovieMeshSeparationQuery.ts#createAutoMovieMeshSeparationQuery

## @evidence contracts/development/implementation.md#principled-implementation

Branch and bound over a median box hierarchy: box pruning uses the outward-rounded axis projection bound of `boundAutoMovieProjectionSeparation`, each surviving triangle the separating-axis bound of `boundAutoMovieConvexSeparation`, and the running minimum starts at the target and only falls, so stopping at the first refutation cannot change certification.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The query owns the snapshot, the walk, attachment admission and budget accounting; the numerical proofs live in the three bound functions, and one private walk serves both the measurement and `separated` so they cannot disagree.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance, sampled distance or nearest corner can certify, an attachment exempts only the supports it proves and only for the fan's own contact, a touching root without metadata stays unproved, and the smallest positive double is a strict-zero threshold, not a spatial allowance.

## @evidence contracts/development/common.md#meaningful-documentation

States the snapshot and its two representations, what a feature is, the pruning and per-triangle rules, what each result field means and does not, the attachment contract, the budget accounting and refusals, and why `separated` agrees with the full measurement.

## @evidence contracts/development/implementation.md#efficient-algorithms

Compilation is linear in triangles plus the hierarchy build; a call visits only boxes that do not already prove the target and bounds only their triangles, each stopping at its first sufficient direction, with every node and triangle as the budget-capped worst case.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The snapshot, triangle boxes, ordinal map and hierarchy are compiled once and reused by every call and both operations; reuse of whole verdicts across identical rows belongs to the hair fit, which keys them on exact coordinates, clearance and attachment presence.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The query retains two copies of each triangle's corners, its box and centre, an ordinal map and the hierarchy, all sized by the triangle count at compile time, and no reference to the caller's mesh; a call allocates only its exemption set and cap list and spends the caller's budget, which it never resets.

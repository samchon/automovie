# src/composition/markAutoMovieContacts.ts#markAutoMovieContacts

## @evidence contracts/development/common.md#meaningful-documentation

States when a contact acts, how each arrow's place, direction and length follow from the step, what geometric receipts draw, the kind, label, colour, path and frame, when a mark is flagged and why static, kinematic and unowned sides are not, how and why an arrow is clamped and labelled, and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

A step's mean force is its normal impulse over its duration, and by reaction the two colliders receive it in opposite directions, so each arrow is the force on the body its path names; a step is read only once completed at or before the drawn second, so a still never shows a later impulse. Only a dynamic segment can be owed a transferred impulse, and the cache's causal ownership is what says which segments were dynamic at that step.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the receipts, each scanned from its last step back to the drawn second, then one mark per side; ownership is grouped by segment only when a stated zero needs it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The scale and the clamp are the caller's stated parameters, a clamped arrow changes kind and label instead of passing for its true length, a step without a duration is refused instead of given an arbitrary length, and no side is chosen by its name: the receipt's canonical pair order decides nothing but the order of the two marks.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the receipts' steps in the worst case; each receipt stops at its latest step at or before the second. Ownership is grouped once per call, linear in its events, and each stated zero scans only its own segment's events back to the step.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure conversion of one second.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh marks and keeps nothing.

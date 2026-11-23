# src/touch/kissPose.ts#kissPose

## @evidence contracts/development/common.md#meaningful-documentation

States the entry, stance and angle units, the seated case and the fresh candidate returned.

## @evidence contracts/development/implementation.md#principled-implementation

Each candidate is the displayed kiss's own body at the full share (`kissBody`: the rise, the hips' shift, the lean and the lowering onto the planted legs) with the head's flexion and turn shared over the neck and the head, so the mouth the search scores is the mouth the figure shows.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One body model, then one head addition.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No candidate skips the lowering the display applies; no angle is clamped here.

## @evidence contracts/development/implementation.md#efficient-algorithms

The head twist's share is prepared once; each candidate costs one body model, the standing lowering's leg fits included.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The body model is `kissBody`, shared with the kiss's display; only the fixed twist's head share is shared across candidates.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The search owns this reader and the twist's share until it returns; each candidate posture is fresh and nothing else is retained.

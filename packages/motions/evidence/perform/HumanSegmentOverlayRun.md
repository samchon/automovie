# src/perform/HumanSegmentOverlayRun.ts#HumanSegmentOverlayRun.running

## @evidence contracts/development/common.md#meaningful-documentation

States film-second input, placement-order output and inclusive comparisons with the existing endpoint allowance.

## @evidence contracts/development/implementation.md#principled-implementation

Filters the person's placed overlays by their active entry and end instants, retaining the existing 1e-12-second comparison allowance at both endpoints.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ordered filter owns active-overlay selection; posture composition remains with the overlay evaluator.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads every overlay's actual interval without changing contact windows, ordering or physical tolerances.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scans N placed overlays in O(N) time and allocates an array of the K active references, O(K) space.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each query reads current overlay intervals and seconds; no persistent selection cache assumes unchanged placement.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a caller-owned array of borrowed overlays and retains no query, person or external handle.

# src/perform/HumanSegmentOverlayRun.ts#HumanSegmentOverlayRun.handing

## @evidence contracts/development/common.md#meaningful-documentation

States the scope, its second and why the entry reads the act's end.

## @evidence contracts/development/implementation.md#principled-implementation

A sequence hands each act's channels to the next at its end, as a blend tree's transition hands a pose on, so the next act starts where the last one ended; a release to the carrier belongs only to an act nothing follows.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scoped second, saved and restored in finally.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only overlays ending at exactly that second are read as handing on; scopes nest and restore on throw.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The second lives for the synchronous read.

# src/perform/HumanSegmentOverlayRun.ts#HumanSegmentOverlayRun.holdsOn

## @evidence contracts/development/common.md#meaningful-documentation

States when an overlay's hand holds a prop on past the overlay's end.

## @evidence contracts/development/implementation.md#principled-implementation

The overlay drives that hand and a hold of it began by the overlay's end and lasts beyond it, so the prop stays in the hand after the overlay is gone.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One drive test and one scan of the person's holds.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `HumanSegmentOverlay`; the handoff tolerance is the one the overlay chain uses.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the person's holds, as before the move.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A boolean read of the person's current holds; nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a boolean and retains nothing.

# src/perform/HumanSegmentOverlayRun.ts#HumanSegmentOverlayRun.released

## @evidence contracts/development/common.md#meaningful-documentation

States how far an overlay still holds its channels at a second.

## @evidence contracts/development/implementation.md#principled-implementation

An overlay that hands its channels on keeps them whole; any other releases them to the carrier on a minimum-jerk share over the fade before its end.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One handoff test, then one closed-form share.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `HumanSegmentOverlay`; the fade is `HumanSegment.FADE`.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work plus the handoff scan of the person's overlays.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A scalar of the overlay's own window; nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a scalar and retains nothing.

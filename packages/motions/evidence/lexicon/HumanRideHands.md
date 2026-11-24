# src/lexicon/HumanRideHands.ts#HumanRideHands.IShown

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

The entry's own displayed pose, posture and holding sides.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Every member is read by `of` and `crossRideReinGrip`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/lexicon/HumanRideHands.ts#HumanRideHands.IHandle

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it holds.

## @evidence contracts/development/design.md#principled-representation

The contact id, its rest point and declaration, and the palm geometry measured for it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by `readRideHandles` and read by `of`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The palm depth is filled once measured, never assumed.

# src/lexicon/HumanRideHands.ts#HumanRideHands.IHands

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it gives.

## @evidence contracts/development/design.md#principled-representation

The lean, the grip reader and the closed fingers.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, all read by the ride.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The grip is read again at each second, so a moving part is followed.

# src/lexicon/HumanRideHands.ts#HumanRideHands

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The grip is the support's point carried by its frame, a moving part's own reading preferred; the lean and the closure are `HumanMountRider`'s.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The points read (`readRideHandles`), the lean, the reader and the fingers' side (`sideRideGrips`), then one closure per hand (`closeRideHandGrips`).

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A hand on a missing point, or fingers with nothing to close on, is refused rather than left open.

## @evidence contracts/development/implementation.md#efficient-algorithms

The fingers are closed once, where the ride begins; each second reads each grip once (`gripsAt`), and the lean is computed from those reads.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `HumanMountRider.lean`, `leant` and `closed`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The record holds the support's reader and the closures only.

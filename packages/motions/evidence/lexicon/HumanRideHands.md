# src/lexicon/HumanRideHands.ts#HumanRideHands.IShown

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

The entry's own displayed pose, posture and holding sides.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Every member is read by `of` and `crossRideReinGrip`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

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

# src/lexicon/HumanRideHands.ts#HumanRideHands.IHands

## @evidence contracts/development/common.md#meaningful-documentation

Names the record `IHumanRideHandsHands` that `HumanRideHands` readers address by this name.

## @evidence contracts/development/design.md#principled-representation

The same record as `IHumanRideHandsHands`, read through `HumanRideHands`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Adds no member; `IHumanRideHandsHands` owns the representation.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

An alias of one record; no optional combination arises.

# src/lexicon/HumanRideHands.ts#HumanRideHands.IHandle

## @evidence contracts/development/common.md#meaningful-documentation

Names the record `IHumanRideHandsHandle` that `HumanRideHands` readers address by this name.

## @evidence contracts/development/design.md#principled-representation

The same record as `IHumanRideHandsHandle`, read through `HumanRideHands`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Adds no member; `IHumanRideHandsHandle` owns the representation.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

An alias of one record; no optional combination arises.
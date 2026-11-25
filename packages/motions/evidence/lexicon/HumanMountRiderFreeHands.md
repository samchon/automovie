# src/lexicon/HumanMountRiderFreeHands.ts#HumanMountRiderFreeHands

## @evidence contracts/development/common.md#meaningful-documentation

States what it computes for `HumanMountRider.hold` and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

The same computation `HumanMountRider.hold` made in place, moved unchanged to its own file.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility of `HumanMountRider.hold`, apart from its other parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `HumanMountRider.hold`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called where `HumanMountRider.hold` computed it before; its cost is the moved code's.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads what `HumanMountRider.hold` reads instead of computing it again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what its result holds, for as long as its caller holds it.
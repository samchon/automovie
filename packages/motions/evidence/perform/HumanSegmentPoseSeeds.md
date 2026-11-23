# src/perform/HumanSegmentPoseSeeds.ts#HumanSegmentPoseSeeds.nearby

## @evidence contracts/development/common.md#meaningful-documentation

Defines absent and null seeds and the tolerance applied to a present named seed.

## @evidence contracts/development/implementation.md#principled-implementation

Looks up the exact fit name and copies its swivel seed with the requested tolerance, preserving basin and branch data.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One optional map lookup followed by an absent check or a shallow seed copy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No seed of another limb, overlay set or fitting stage substitutes for a missing name.

## @evidence contracts/development/implementation.md#efficient-algorithms

One map lookup and one bounded seed-record copy when present.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

No completed numerical work is coordinated; the supplied seed owner decides which fit is equivalent.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing and returns a new seed wrapper with the original seed's borrowed member values.

# src/perform/HumanSegmentPoseSeeds.ts#HumanSegmentPoseSeeds.continues

## @evidence contracts/development/common.md#meaningful-documentation

States the distinction and who reads it.

## @evidence contracts/development/implementation.md#principled-implementation

A course fixes the branch and swivel; it reads no other second.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One test.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No fit is changed.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/perform/HumanSegmentPoseSeeds.ts#HumanSegmentPoseSeeds.shown

## @evidence contracts/development/common.md#meaningful-documentation

States which leaf is taken per limb and how it is renamed.

## @evidence contracts/development/implementation.md#principled-implementation `HumanSegmentOverlay.overlaid` names each leaf fit by the comma-joined ordinals of the overlays written over it; the leaf with the most is the one under every running overlay, whose fit the pose shows.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the fits keeping the deepest leaf per limb, then one renaming pass.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only a leaf fit of the same limb in the same read is taken; no other stage's or limb's seed stands in.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the read's fits.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure renaming; nothing is computed to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new map of the borrowed seeds and retains nothing.

# src/perform/HumanSegmentPoseSeeds.ts#HumanSegmentPoseSeeds.IFits

## @evidence contracts/development/common.md#meaningful-documentation

States exact fit-name keys, chosen swivel seeds and null entries.

## @evidence contracts/development/design.md#principled-representation

A map preserves stage/overlay/limb fit names and the engine's seed representation without conflating no seed with a different fit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One existing Map alias shared by seeded evaluation, nearby continuation and overlay fitting.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses IAutoMovieSwivelSeed and records null explicitly; no second pose or independently tuned branch key is introduced.

# src/perform/HumanSegmentPoseSeeds.ts#HumanSegmentPoseSeeds.INear

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its content.

## @evidence contracts/development/design.md#principled-representation

The seeds by fit name and the one tolerance they are refined to (`IAutoMovieSwivelNear`).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses `IAutoMovieSwivelSeed`.

# src/perform/HumanSegmentPoseSeeds.ts#HumanSegmentPoseSeeds.ISeeded

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its content.

## @evidence contracts/development/design.md#principled-representation

The pose and its fits by name.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses `IFits`.

# src/perform/HumanSegmentPoseSeeds.ts#HumanSegmentPoseSeeds.IContinued

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its content.

## @evidence contracts/development/design.md#principled-representation

The state and the samples its rates were differenced from.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses `samplePoseVelocity.IState`.

# src/lexicon/HumanWeaponPose.ts#HumanWeaponPose.IPosed

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its frame and unit.

## @evidence contracts/development/design.md#principled-representation

What the stroke and its refusal read of a presentation: the trunk's turn, the posture, the sight line's ends and the hand frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The stroke and grip admission read the same modeled tool and pivot as the pose choice.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None optional.

# src/lexicon/HumanWeaponPose.ts#HumanWeaponPose

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The bore's line on the line from the anchor to the target, an extended arm's working point where that line meets the arm's own reach, a ready region's pose (`HumanFirearmReady`), or the recover's upright bore above the support side's breast (the 1764 Manual Exercise), on the bladed trunk a long gun is shouldered from, square at the recover.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The entry, the turn, the anchor, the target and its angle, then the pose by carriage.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A target past `TURN`, or past a seated trunk's turn and `TURN`, is refused, never clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

One trunk resolution and the carriage's pose choice.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Read once per plan and once per weighed grip.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

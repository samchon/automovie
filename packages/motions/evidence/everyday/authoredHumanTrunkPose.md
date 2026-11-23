# src/everyday/authoredHumanTrunkPose.ts#authoredHumanTrunkPose

## @evidence contracts/development/common.md#meaningful-documentation

States the root and clinical-degree inputs, the ignored limb goals, the absent-entry rule and the fresh output.

## @evidence contracts/development/implementation.md#principled-implementation

Lists every present joint entry as a clinical flexion/abduction/twist record, then builds the root with turnHumanPosture over the posture without limbs and Transform.of; the engine's forward kinematics admits the joints.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One joint-list conversion, one root construction and one pose record; HumanTrunk.resolve is its consumer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Each present entry passes to forward kinematics as authored, with no clamp, limb fit or root approximation; an entry whose value is absent is skipped, as an absent key is.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(J) in the J joint entries, one record each.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the canonical turnHumanPosture and Transform owners; nothing is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds no state; the caller owns the new pose.

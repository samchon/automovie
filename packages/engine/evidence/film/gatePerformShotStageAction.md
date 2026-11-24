# src/film/gatePerformShotStageAction.ts#gatePerformShotStageAction

## @evidence contracts/development/implementation.md#principled-implementation

Checks optional attachment position and quaternion, verb domains, supplied gait vocabulary, force bounds, available rig elbow geometry through armChainFault and locomote displacement through classifyLocomoteGroundDisplacement. These gates admit supported structure; absent rig context skips arm geometry and a custom synthesizer can still return null.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The verb dispatch of the action gate, separate from the checks every action shares in `gatePerformShotActions`; target resolution is the shared `resolvePerformShotTarget`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No actor, gait or prop is special-cased; a known unbendable arm is refused before the reference synthesizer's null result, while absent rig context and arbitrary callback null results are outside that proof. Camera aims remain legal for launch without onHit.

## @evidence contracts/development/common.md#meaningful-documentation

States every verb's requirements and the reason behind the non-obvious ones, why an unbendable arm is refused here, and which jobs are recorded.

## @evidence contracts/development/implementation.md#efficient-algorithms

Actor-dependent checks visit actor lists, supplied gait vocabularies and rig chains; target resolution additionally traverses group membership or bone context. Supplied gait, skeleton and target callbacks add delegated work, while refusal text grows with represented values and may invoke user conversion hooks.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Gates one action per call; the staged tables are the shared context's.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Appends at most one job to the caller's plan and retains nothing itself.
